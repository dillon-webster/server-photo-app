import type { FastifyInstance } from "fastify";
import { processUpload } from "../services/upload.js";

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/api/upload", async (req, reply) => {
    const parts = req.files();
    const results = [];

    for await (const part of parts) {
      if (part.type !== "file") continue;

      const size = parseInt(req.headers["content-length"] ?? "0", 10);
      const photo = await processUpload(
        part.file,
        part.filename,
        part.mimetype,
        size
      );
      results.push(photo);
    }

    return reply.send(results);
  });
}
