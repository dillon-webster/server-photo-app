import type { FastifyInstance } from "fastify";
import { processUpload } from "../services/upload.js";

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/api/upload", async (req, reply) => {
    const parts = req.files();
    const results = [];

    for await (const part of parts) {
      if (part.type !== "file") continue;
      try {
        const photo = await processUpload(part.file, part.filename, part.mimetype);
        results.push({ filename: part.filename, ok: true, photo });
      } catch (err) {
        req.log.error({ err, filename: part.filename }, "upload failed");
        results.push({ filename: part.filename, ok: false });
      }
    }

    return reply.send(results);
  });
}
