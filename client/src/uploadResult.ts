import type { Photo } from "./types";

export interface UploadResult {
  filename: string;
  ok: boolean;
  photo?: Photo;
  error?: string;
}

export function uploadResultError(result: UploadResult) {
  return result.error?.trim() || "Upload failed";
}

export function missingDatePhotoIds(results: UploadResult[]) {
  return results.flatMap((result) => {
    const photo = result.photo;
    return result.ok && photo && photo.dateTaken == null ? [photo.id] : [];
  });
}

// Fastify's stock 413 body says "Payload Too Large", and a reverse proxy in
// front of the server may not send JSON at all — neither tells you what to do.
const GENERIC_TOO_LARGE = "Payload Too Large";
const TOO_LARGE_FALLBACK =
  "File is too large for the server. Ask the admin to raise MAX_UPLOAD_MB.";

export function uploadRequestError(status: number, responseText: string) {
  let body: { error?: string; message?: string } = {};
  try {
    body = JSON.parse(responseText);
  } catch {
    // non-JSON response (proxy error page) — fall through to status defaults
  }
  const message = body.error || body.message;
  if (status === 413) {
    return message && message !== GENERIC_TOO_LARGE ? message : TOO_LARGE_FALLBACK;
  }
  return message || `Upload failed: ${status}`;
}
