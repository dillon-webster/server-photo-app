type NormalizedPhotoDate =
  | { valid: true; value: number | null }
  | { valid: false };

export function normalizePhotoDate(value: unknown): NormalizedPhotoDate {
  if (value === null || value === "") {
    return { valid: true, value: null };
  }

  const timestamp =
    typeof value === "number" ? value : new Date(String(value)).getTime();

  if (!Number.isFinite(timestamp)) {
    return { valid: false };
  }

  return { valid: true, value: timestamp };
}
