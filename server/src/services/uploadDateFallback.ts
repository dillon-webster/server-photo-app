type UploadDateFallbackResult =
  | { valid: true; value: number | null }
  | { valid: false };

export function parseUploadDateFallback(
  rawDate: unknown,
): UploadDateFallbackResult {
  if (rawDate === undefined || rawDate === null || rawDate === "") {
    return { valid: true, value: null };
  }

  if (typeof rawDate !== "string") {
    return { valid: false };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawDate);
  if (!match) {
    return { valid: false };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  if (
    year < 1000 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { valid: false };
  }

  return {
    valid: true,
    value: date.getTime(),
  };
}

export function resolveUploadDate(
  extractedDate: number | null,
  fallbackDate: number | null,
) {
  return extractedDate ?? fallbackDate;
}
