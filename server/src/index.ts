import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import { db, sqlite, runMigrations } from "./db/client.js";
import { ensureUploadDirs } from "./services/upload.js";
import { uploadRoutes } from "./routes/upload.js";
import { photoRoutes } from "./routes/photos.js";
import { albumRoutes } from "./routes/albums.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";
const MIGRATIONS_DIR = join(__dirname, "db", "migrations");

ensureUploadDirs();
runMigrations(MIGRATIONS_DIR);

const app = Fastify({ logger: { transport: { target: "pino-pretty" } } });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 500 * 1024 * 1024 } }); // 500 MB

// Serve upload files
await app.register(staticFiles, {
  root: join(process.cwd(), UPLOADS_DIR),
  prefix: "/uploads/",
  decorateReply: false,
});

// Serve built client in production
const CLIENT_DIST = join(__dirname, "../../client/dist");
await app.register(staticFiles, {
  root: CLIENT_DIST,
  prefix: "/",
  decorateReply: false,
  wildcard: false,
});

await app.register(uploadRoutes);
await app.register(photoRoutes);
await app.register(albumRoutes);

// SPA fallback — serve index.html for unmatched routes
app.setNotFoundHandler(async (req, reply) => {
  if (!req.url.startsWith("/api/") && !req.url.startsWith("/uploads/")) {
    return reply.sendFile("index.html", CLIENT_DIST);
  }
  return reply.status(404).send({ error: "Not found" });
});

await app.listen({ port: PORT, host: "0.0.0.0" });

const shutdown = async () => {
  await app.close();
  sqlite.close();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
