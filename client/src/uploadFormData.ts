export interface UploadDateFallback {
  date: string;
}

export function buildUploadFormData(
  files: File[],
  fallback: UploadDateFallback,
) {
  const formData = new FormData();
  formData.append("fallbackDate", fallback.date);
  files.forEach((file) => formData.append("files", file));
  return formData;
}
