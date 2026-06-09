import { createWriteStream, mkdirSync } from "fs";
import { unlink } from "fs/promises";
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

export function ensureUploadDirs() {
  mkdirSync(ORIGINALS_DIR, { recursive: true });
  mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

export async function processUpload(
  fileStream: Readable,
  originalName: string,
  mimeType: string,
  fileSize: number
): Promise<Photo> {
  const id = uuidv4();
  const ext = extname(originalName).toLowerCase() || ".jpg";
  const filename = `${id}${ext}`;
  const originalPath = join(ORIGINALS_DIR, filename);
  const thumbnailFilename = `${id}.webp`;
  const thumbnailPath = join(THUMBNAILS_DIR, thumbnailFilename);

  await pipeline(fileStream, createWriteStream(originalPath));

  let exifData: Awaited<ReturnType<typeof exifr.parse>> = null;
  try {
    exifData = await exifr.parse(originalPath, {
      gps: true,
      pick: ["DateTimeOriginal", "latitude", "longitude", "GPSLatitude", "GPSLongitude"],
    });
  } catch {
    // EXIF parsing is best-effort
  }

  const dateTaken = exifData?.DateTimeOriginal
    ? new Date(exifData.DateTimeOriginal).getTime()
    : null;
  const latitude = exifData?.latitude ?? null;
  const longitude = exifData?.longitude ?? null;

  let width = 0;
  let height = 0;
  try {
    const sharpInstance = sharp(originalPath);
    const meta = await sharpInstance.metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;

    await sharpInstance
      .rotate() // auto-rotate from EXIF orientation
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);
  } catch (err) {
    await unlink(originalPath).catch(() => {});
    throw err;
  }

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
}
