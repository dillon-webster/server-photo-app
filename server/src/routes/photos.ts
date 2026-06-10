import type { FastifyInstance } from "fastify";
import { and, eq, isNotNull } from "drizzle-orm";
import { unlink } from "fs/promises";
import { join } from "path";
import { db } from "../db/client.js";
import { albums, photos } from "../db/schema.js";

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
      .select({
        id: photos.id,
        filename: photos.filename,
        latitude: photos.latitude,
        longitude: photos.longitude,
        dateTaken: photos.dateTaken,
        city: photos.city,
        country: photos.country,
      })
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
    ]);
    for (const r of unlinkResults) {
      if (r.status === "rejected") req.log.warn({ err: r.reason }, "failed to unlink file on delete");
    }

    return { ok: true };
  });
}
