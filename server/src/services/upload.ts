import { createWriteStream, mkdirSync } from "fs";
import { unlink, stat } from "fs/promises";
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

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";
const ORIGINALS_DIR = join(UPLOADS_DIR, "originals");
const THUMBNAILS_DIR = join(UPLOADS_DIR, "thumbnails");

// Fix 5: whitelisted extensions
const ALLOWED_EXTS = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".gif", ".tiff", ".tif"]);

export function ensureUploadDirs() {
  mkdirSync(ORIGINALS_DIR, { recursive: true });
  mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

// Fix 4: removed fileSize parameter — real size is read from disk after write
export async function processUpload(
  fileStream: Readable,
  originalName: string,
  mimeType: string
): Promise<Photo> {
  const id = uuidv4();

  // Fix 5: whitelist extension
  const rawExt = extname(originalName).toLowerCase();
  const ext = ALLOWED_EXTS.has(rawExt) ? rawExt : ".jpg";

  const filename = `${id}${ext}`;
  const originalPath = join(ORIGINALS_DIR, filename);
  const thumbnailFilename = `${id}.webp`;
  const thumbnailPath = join(THUMBNAILS_DIR, thumbnailFilename);

  await pipeline(fileStream, createWriteStream(originalPath));

  // Fix 3: reject truncated uploads (client disconnected mid-upload)
  if ((fileStream as any).truncated) {
    await unlink(originalPath).catch(() => {});
    throw new Error(`Upload truncated: ${originalName}`);
  }

  // Fix 4: get real file size from disk
  const { size: fileSize } = await stat(originalPath);

  // Fix 2: broad try/catch — clean up both files on any downstream failure
  try {
    let exifData: Awaited<ReturnType<typeof exifr.parse>> = null;
    try {
      exifData = await exifr.parse(originalPath, { gps: true });
    } catch {
      // EXIF parsing is best-effort
    }

    // Fix 6: validate EXIF date to prevent NaN
    const rawTs = exifData?.DateTimeOriginal
      ? new Date(exifData.DateTimeOriginal).getTime()
      : null;
    const dateTaken = rawTs != null && Number.isFinite(rawTs) ? rawTs : null;

    const latitude = exifData?.latitude ?? null;
    const longitude = exifData?.longitude ?? null;

    let width = 0;
    let height = 0;
    const sharpInstance = sharp(originalPath);
    const meta = await sharpInstance.metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;

    await sharpInstance
      .rotate() // auto-rotate from EXIF orientation
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

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
    throw err;
  }
}
