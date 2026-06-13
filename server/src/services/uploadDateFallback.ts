type UploadDateFallbackResult =
  | { valid: true; value: number | null }
  | { valid: false };

export function parseUploadDateFallback(
  rawYear: unknown,
  rawMonth: unknown,
): UploadDateFallbackResult {
  const hasYear = rawYear !== undefined && rawYear !== null && rawYear !== "";
  const hasMonth = rawMonth !== undefined && rawMonth !== null && rawMonth !== "";

  if (!hasYear && !hasMonth) {
    return { valid: true, value: null };
  }
  if (!hasYear || !hasMonth) {
    return { valid: false };
  }

  const year = Number(rawYear);
  const month = Number(rawMonth);
  if (
    !Number.isInteger(year) ||
    year < 1000 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return { valid: false };
  }

  return {
    valid: true,
    value: new Date(year, month - 1, 1, 12).getTime(),
  };
}

export function resolveUploadDate(
  extractedDate: number | null,
  fallbackDate: number | null,
) {
  return extractedDate ?? fallbackDate;
}
