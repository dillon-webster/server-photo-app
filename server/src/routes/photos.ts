import type { FastifyInstance } from "fastify";
import { and, eq, isNotNull } from "drizzle-orm";
import { unlink } from "fs/promises";
import { join } from "path";
import { db } from "../db/client.js";
import { albums, photos } from "../db/schema.js";
import { forwardGeocode, reverseGeocode } from "../services/geocode.js";
import { normalizePhotoDate } from "./photoDate.js";

interface PhotoPatch {
  dateTaken?: string | number | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationSearch?: string | null;
}

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function photoRoutes(app: FastifyInstance) {
  // Timeline: grouped by year → month
  app.get("/api/photos/timeline", async () => {
    const rows = db
      .select()
      .from(photos)
      .orderBy(photos.dateTaken)
      .all();

    // Group into { year: { month: Photo[] } }, newest year first
    const grouped: Record<string, Record<string, typeof rows>> = {};
    for (const photo of rows) {
      const ts = photo.dateTaken ?? photo.dateUploaded;
      const d = new Date(ts);
      const year = d.getFullYear().toString();
      const month = MONTHS[d.getMonth()];
      grouped[year] ??= {};
      grouped[year][month] ??= [];
      grouped[year][month].push(photo);
    }

    // Convert to sorted array (newest first)
    const result = Object.keys(grouped)
      .sort((a, b) => Number(b) - Number(a))
      .map((year) => ({
        year,
        months: Object.keys(grouped[year])
          .sort((a, b) => MONTHS.indexOf(b) - MONTHS.indexOf(a))
          .map((month) => ({
            month,
            photos: grouped[year][month].reverse(),
          })),
      }));

    return result;
  });

  // Map: only photos with GPS
  app.get("/api/photos/map", async () => {
    return db
      .select()
      .from(photos)
      .where(and(isNotNull(photos.latitude), isNotNull(photos.longitude)))
      .all();
  });

  // Single photo metadata
  app.get<{ Params: { id: string } }>("/api/photos/:id", async (req, reply) => {
    const photo = db.select().from(photos).where(eq(photos.id, req.params.id)).get();
    if (!photo) return reply.status(404).send({ error: "Not found" });
    return photo;
  });

  // Update photo metadata (date, location)
  app.patch<{ Params: { id: string }; Body: PhotoPatch }>("/api/photos/:id", async (req, reply) => {
    const photo = db.select().from(photos).where(eq(photos.id, req.params.id)).get();
    if (!photo) return reply.status(404).send({ error: "Not found" });

    const body = req.body;
    const patch: Partial<typeof photos.$inferInsert> = {};

    if ("dateTaken" in body) {
      const normalizedDate = normalizePhotoDate(body.dateTaken);
      if (!normalizedDate.valid) {
        return reply.status(400).send({ error: "Invalid date" });
      }
      patch.dateTaken = normalizedDate.value;
    }
    if ("city" in body) patch.city = body.city ?? null;
    if ("country" in body) patch.country = body.country ?? null;
    if ("latitude" in body) patch.latitude = body.latitude ?? null;
    if ("longitude" in body) patch.longitude = body.longitude ?? null;

    // Auto-geocode: locationSearch takes priority; fall back to city+country for photos with no coords
    const hasExplicitCoords = "latitude" in body || "longitude" in body;
    if (hasExplicitCoords && patch.latitude != null && patch.longitude != null) {
      const geo = await reverseGeocode(patch.latitude, patch.longitude);
      patch.city = geo.city;
      patch.country = geo.country;
    }
    if (!hasExplicitCoords) {
      const searchQuery = body.locationSearch?.trim();
      const fallbackQuery = (() => {
        if (photo.latitude != null && photo.longitude != null) return null; // already has coords
        const cityVal = patch.city ?? photo.city;
        const countryVal = patch.country ?? photo.country;
        return [cityVal, countryVal].filter(Boolean).join(", ") || null;
      })();
      const query = searchQuery || fallbackQuery;
      if (query) {
        const coords = await forwardGeocode(query);
        if (coords) {
          patch.latitude = coords.latitude;
          patch.longitude = coords.longitude;
          const geo = await reverseGeocode(coords.latitude, coords.longitude);
          patch.city = geo.city;
          patch.country = geo.country;
        }
      }
    }

    db.update(photos).set(patch).where(eq(photos.id, req.params.id)).run();
    return db.select().from(photos).where(eq(photos.id, req.params.id)).get();
  });

  // Delete photo
  app.delete<{ Params: { id: string } }>("/api/photos/:id", async (req, reply) => {
    const photo = db.select().from(photos).where(eq(photos.id, req.params.id)).get();
    if (!photo) return reply.status(404).send({ error: "Not found" });

    db.delete(photos).where(eq(photos.id, req.params.id)).run();

    db.update(albums)
      .set({ coverPhotoId: null, updatedAt: Date.now() })
      .where(eq(albums.coverPhotoId, req.params.id))
      .run();

    const unlinkResults = await Promise.allSettled([
      unlink(join(UPLOADS_DIR, "originals", photo.filename)),
      unlink(join(UPLOADS_DIR, "thumbnails", `${photo.id}.webp`)),
      unlink(join(UPLOADS_DIR, "playback", `${photo.id}.mp4`)),
    ]);
    for (const r of unlinkResults) {
      if (r.status === "rejected") req.log.warn({ err: r.reason }, "failed to unlink file on delete");
    }

    return { ok: true };
  });
}
