import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  duration: integer("duration"),
  dateTaken: integer("date_taken"),
  dateUploaded: integer("date_uploaded").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  city: text("city"),
  country: text("country"),
});

export const albums = sqliteTable("albums", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coverPhotoId: text("cover_photo_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const albumPhotos = sqliteTable(
  "album_photos",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    photoId: text("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    addedAt: integer("added_at").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.albumId, t.photoId] }) })
);

export type Photo = typeof photos.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type AlbumPhoto = typeof albumPhotos.$inferSelect;
