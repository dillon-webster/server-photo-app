import type { FastifyInstance } from "fastify";
import { eq, and, inArray, max } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client.js";
import { albums, albumPhotos, photos } from "../db/schema.js";

export async function albumRoutes(app: FastifyInstance) {
  // List all albums with photo count
  app.get("/api/albums", async () => {
    const rows = db.select().from(albums).orderBy(albums.createdAt).all();
    return rows;
  });

  // Create album
  app.post<{ Body: { name: string; description?: string } }>("/api/albums", async (req, reply) => {
    const { name, description } = req.body;
    if (!name?.trim()) return reply.status(400).send({ error: "name required" });

    const now = Date.now();
    const album = {
      id: uuidv4(),
      name: name.trim(),
      description: description ?? null,
      coverPhotoId: null,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(albums).values(album).run();
    return reply.status(201).send(album);
  });

  // Get album with photos
  app.get<{ Params: { id: string } }>("/api/albums/:id", async (req, reply) => {
    const album = db.select().from(albums).where(eq(albums.id, req.params.id)).get();
    if (!album) return reply.status(404).send({ error: "Not found" });

    const albumPhotoRows = db
      .select({ photo: photos })
      .from(albumPhotos)
      .innerJoin(photos, eq(albumPhotos.photoId, photos.id))
      .where(eq(albumPhotos.albumId, req.params.id))
      .orderBy(albumPhotos.sortOrder)
      .all();

    return { ...album, photos: albumPhotoRows.map((r) => r.photo) };
  });

  // Update album
  app.put<{ Params: { id: string }; Body: { name?: string; description?: string; coverPhotoId?: string | null } }>(
    "/api/albums/:id",
    async (req, reply) => {
      const album = db.select().from(albums).where(eq(albums.id, req.params.id)).get();
      if (!album) return reply.status(404).send({ error: "Not found" });

      const updates: Partial<typeof album> = { updatedAt: Date.now() };
      if (req.body.name !== undefined) updates.name = req.body.name.trim();
      if (req.body.description !== undefined) updates.description = req.body.description;
      if ("coverPhotoId" in req.body) updates.coverPhotoId = req.body.coverPhotoId ?? null;

      db.update(albums).set(updates).where(eq(albums.id, req.params.id)).run();
      return { ...album, ...updates };
    }
  );

  // Delete album
  app.delete<{ Params: { id: string } }>("/api/albums/:id", async (req, reply) => {
    const album = db.select().from(albums).where(eq(albums.id, req.params.id)).get();
    if (!album) return reply.status(404).send({ error: "Not found" });
    db.delete(albums).where(eq(albums.id, req.params.id)).run();
    return { ok: true };
  });

  // Add photos to album
  app.post<{ Params: { id: string }; Body: { photoIds: string[] } }>(
    "/api/albums/:id/photos",
    async (req, reply) => {
      const album = db.select().from(albums).where(eq(albums.id, req.params.id)).get();
      if (!album) return reply.status(404).send({ error: "Not found" });

      const { photoIds } = req.body;
      if (!Array.isArray(photoIds) || photoIds.length === 0) {
        return reply.status(400).send({ error: "photoIds required" });
      }

      // Find max sort order
      const maxRow = db
        .select({ max: max(albumPhotos.sortOrder) })
        .from(albumPhotos)
        .where(eq(albumPhotos.albumId, req.params.id))
        .get();
      let sortOrder = (maxRow?.max ?? -1) + 1;

      const now = Date.now();
      for (const photoId of photoIds) {
        db.insert(albumPhotos)
          .values({ albumId: req.params.id, photoId, addedAt: now, sortOrder: sortOrder++ })
          .onConflictDoNothing()
          .run();
      }

      // Auto-set cover if album has none
      if (!album.coverPhotoId && photoIds[0]) {
        db.update(albums)
          .set({ coverPhotoId: photoIds[0], updatedAt: now })
          .where(eq(albums.id, req.params.id))
          .run();
      }

      return { ok: true };
    }
  );

  // Remove photo from album
  app.delete<{ Params: { id: string; photoId: string } }>(
    "/api/albums/:id/photos/:photoId",
    async (req, reply) => {
      db.delete(albumPhotos)
        .where(
          and(
            eq(albumPhotos.albumId, req.params.id),
            eq(albumPhotos.photoId, req.params.photoId)
          )
        )
        .run();
      return { ok: true };
    }
  );
}
