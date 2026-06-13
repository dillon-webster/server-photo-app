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

export function uploadRequestError(status: number, responseText: string) {
  try {
    const body = JSON.parse(responseText) as {
      error?: string;
      message?: string;
    };
    return body.error || body.message || `Upload failed: ${status}`;
  } catch {
    return `Upload failed: ${status}`;
  }
}
