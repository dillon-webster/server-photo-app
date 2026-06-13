export interface UploadDateFallback {
  year: number;
  month: number;
}

export function buildUploadFormData(
  files: File[],
  fallback: UploadDateFallback,
) {
  const formData = new FormData();
  formData.append("fallbackYear", String(fallback.year));
  formData.append("fallbackMonth", String(fallback.month));
  files.forEach((file) => formData.append("files", file));
  return formData;
}
