import { createWriteStream, mkdirSync } from "fs";
import { unlink, stat } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { tmpdir } from "os";
import { extname, join } from "path";
import { pipeline } from "stream/promises";
import type { Readable } from "stream";
import sharp from "sharp";
import exifr from "exifr";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client.js";
import { photos } from "../db/schema.js";
import { reverseGeocode } from "./geocode.js";
import type { Photo } from "../db/schema.js";
import { resolveUploadDate } from "./uploadDateFallback.js";
import { createVideoPlayback } from "./videoPlayback.js";

const execFileAsync = promisify(execFile);

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";
const ORIGINALS_DIR = join(UPLOADS_DIR, "originals");
const THUMBNAILS_DIR = join(UPLOADS_DIR, "thumbnails");
const PLAYBACK_DIR = join(UPLOADS_DIR, "playback");

const ALLOWED_IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".gif", ".tiff", ".tif"]);
const ALLOWED_VIDEO_EXTS = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"]);

// EXIF dates arrive as JS Date objects OR raw strings like "2015:10:15 14:22:01"
// (colons as date separators — not ISO-parseable by Date constructor)
function parseExifDate(raw: unknown): number | null {
  if (!raw) return null;
  let d: Date;
  if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === "string") {
    d = new Date(raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"));
  } else {
    return null;
  }
  const ts = d.getTime();
  return Number.isFinite(ts) && ts > 0 ? ts : null;
}

export function ensureUploadDirs() {
  mkdirSync(ORIGINALS_DIR, { recursive: true });
  mkdirSync(THUMBNAILS_DIR, { recursive: true });
  mkdirSync(PLAYBACK_DIR, { recursive: true });
}

async function getVideoMetadata(filePath: string) {
  const { stdout } = await execFileAsync(
    "ffprobe",
    ["-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", filePath],
    { maxBuffer: 10 * 1024 * 1024 }
  );

  const data = JSON.parse(stdout);
  const format = data.format ?? {};
  const videoStream = (data.streams ?? []).find(
    (s: Record<string, unknown>) => s.codec_type === "video"
  );

  const durationSec = parseFloat(format.duration ?? "0");
  const duration =
    Number.isFinite(durationSec) && durationSec > 0
      ? Math.round(durationSec * 1000)
      : null;

  let width: number = (videoStream?.width as number) ?? 0;
  let height: number = (videoStream?.height as number) ?? 0;
  // Swap dimensions for videos rotated 90°/270°
  const rotationTag = (videoStream?.tags as Record<string, string>)?.rotate;
  const rotation = rotationTag ? parseInt(rotationTag, 10) : 0;
  if (Math.abs(rotation) === 90 || Math.abs(rotation) === 270) {
    [width, height] = [height, width];
  }

  const tags = (format.tags ?? {}) as Record<string, string>;
  const creationTime =
    tags["com.apple.quicktime.creationdate"] ??
    tags["creation_time"] ??
    (videoStream?.tags as Record<string, string>)?.creation_time;
  const rawTs = creationTime ? new Date(creationTime).getTime() : null;
  const dateTaken = rawTs != null && Number.isFinite(rawTs) ? rawTs : null;

  // iPhone ISO6709 location format: +37.3305-122.0296+050.000/
  let latitude: number | null = null;
  let longitude: number | null = null;
  const locationTag =
    tags["com.apple.quicktime.location.ISO6709"] ?? tags["location"];
  if (locationTag) {
    const match = locationTag.match(/([+-]\d+\.?\d*)([+-]\d+\.?\d*)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        latitude = lat;
        longitude = lon;
      }
    }
  }

  return { duration, width, height, dateTaken, latitude, longitude };
}

async function extractVideoThumbnail(
  videoPath: string,
  thumbnailPath: string
): Promise<void> {
  const tempJpg = join(tmpdir(), `${uuidv4()}.jpg`);
  try {
    try {
      await execFileAsync("ffmpeg", [
        "-ss", "1",
        "-i", videoPath,
        "-vframes", "1",
        "-q:v", "2",
        "-y",
        tempJpg,
      ]);
    } catch {
      // Video shorter than 1s — extract from beginning
      await execFileAsync("ffmpeg", [
        "-i", videoPath,
        "-vframes", "1",
        "-q:v", "2",
        "-y",
        tempJpg,
      ]);
    }

    await sharp(tempJpg)
      .rotate()
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);
  } finally {
    await unlink(tempJpg).catch(() => {});
  }
}

export async function processUpload(
  fileStream: Readable,
  originalName: string,
  mimeType: string,
  fallbackDate: number | null = null,
): Promise<Photo> {
  const id = uuidv4();
  const rawExt = extname(originalName).toLowerCase();
  const isVideoFile =
    ALLOWED_VIDEO_EXTS.has(rawExt) || mimeType.startsWith("video/");

  let ext: string;
  if (isVideoFile) {
    ext = ALLOWED_VIDEO_EXTS.has(rawExt) ? rawExt : ".mp4";
  } else {
    ext = ALLOWED_IMAGE_EXTS.has(rawExt) ? rawExt : ".jpg";
  }

  const filename = `${id}${ext}`;
  const originalPath = join(ORIGINALS_DIR, filename);
  const thumbnailFilename = `${id}.webp`;
  const thumbnailPath = join(THUMBNAILS_DIR, thumbnailFilename);
  const playbackPath = join(PLAYBACK_DIR, `${id}.mp4`);

  await pipeline(fileStream, createWriteStream(originalPath));

  if ((fileStream as any).truncated) {
    await unlink(originalPath).catch(() => {});
    throw new Error(`Upload truncated: ${originalName}`);
  }

  const { size: fileSize } = await stat(originalPath);

  try {
    let dateTaken: number | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;
    let width = 0;
    let height = 0;
    let duration: number | null = null;

    if (isVideoFile) {
      const meta = await getVideoMetadata(originalPath);
      dateTaken = meta.dateTaken;
      latitude = meta.latitude;
      longitude = meta.longitude;
      width = meta.width;
      height = meta.height;
      duration = meta.duration;
      await extractVideoThumbnail(originalPath, thumbnailPath);
      await createVideoPlayback(originalPath, playbackPath);
    } else {
      let exifData: Awaited<ReturnType<typeof exifr.parse>> = null;
      try {
        exifData = await exifr.parse(originalPath, { gps: true });
      } catch {
        // EXIF parsing is best-effort
      }

      const rawDate =
        exifData?.DateTimeOriginal ??
        exifData?.CreateDate ??
        exifData?.SubSecDateTimeOriginal ??
        exifData?.SubSecCreateDate ??
        exifData?.DateTime;
      dateTaken = parseExifDate(rawDate);
      latitude = exifData?.latitude ?? null;
      longitude = exifData?.longitude ?? null;

      const sharpInstance = sharp(originalPath);
      const meta = await sharpInstance.metadata();
      width = meta.width ?? 0;
      height = meta.height ?? 0;
      await sharpInstance
        .rotate()
        .resize(400, 400, { fit: "cover" })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
    }
    dateTaken = resolveUploadDate(dateTaken, fallbackDate);

    let city: string | null = null;
    let country: string | null = null;
    if (latitude != null && longitude != null) {
      const geo = await reverseGeocode(latitude, longitude);
      city = geo.city;
      country = geo.country;
    }

    const photo: Photo = {
      id,
      filename,
      originalName,
      mimeType,
      size: fileSize,
      width,
      height,
      duration,
      dateTaken,
      dateUploaded: Date.now(),
      latitude,
      longitude,
      city,
      country,
    };

    db.insert(photos).values(photo).run();
    return photo;
  } catch (err) {
    await unlink(originalPath).catch(() => {});
    await unlink(thumbnailPath).catch(() => {});
    await unlink(playbackPath).catch(() => {});
    throw err;
  }
}
