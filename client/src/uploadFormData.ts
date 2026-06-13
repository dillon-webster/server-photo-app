export function buildUploadFormData(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return formData;
}
