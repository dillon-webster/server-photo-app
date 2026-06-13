import type { FastifyInstance } from "fastify";
import { processUpload } from "../services/upload.js";
import { parseUploadDateFallback } from "../services/uploadDateFallback.js";
import { uploadErrorMessage } from "./uploadError.js";

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/api/upload", async (req, reply) => {
    const parts = req.parts();
    const results = [];
    let rawFallbackYear: unknown;
    let rawFallbackMonth: unknown;
    let fallbackDate: number | null | undefined;

    for await (const part of parts) {
      if (part.type === "field") {
        if (part.fieldname === "fallbackYear") rawFallbackYear = part.value;
        if (part.fieldname === "fallbackMonth") rawFallbackMonth = part.value;
        continue;
      }

      if (fallbackDate === undefined) {
        const parsedFallback = parseUploadDateFallback(
          rawFallbackYear,
          rawFallbackMonth,
        );
        if (!parsedFallback.valid) {
          return reply.status(400).send({ error: "Invalid upload year or month" });
        }
        fallbackDate = parsedFallback.value;
      }

      try {
        const photo = await processUpload(
          part.file,
          part.filename,
          part.mimetype,
          fallbackDate,
        );
        results.push({ filename: part.filename, ok: true, photo });
      } catch (err) {
        req.log.error({ err, filename: part.filename }, "upload failed");
        results.push({
          filename: part.filename,
          ok: false,
          error: uploadErrorMessage(err),
        });
      }
    }

    return reply.send(results);
  });
}
