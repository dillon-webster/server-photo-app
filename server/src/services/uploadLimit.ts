// Phone video is the reason this is large: iPhone 4K runs ~350 MB/min, so a
// few minutes of footage blows past any "photo-sized" limit.
const DEFAULT_MAX_UPLOAD_MB = 5120; // 5 GB

export function parseMaxUploadBytes(raw: string | undefined): number {
  const mb = Number(raw);
  if (!Number.isFinite(mb) || mb <= 0) return DEFAULT_MAX_UPLOAD_MB * 1024 * 1024;
  return Math.floor(mb) * 1024 * 1024;
}

export function formatBytes(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${Number(gb.toFixed(1))} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

export function fileTooLargeMessage(maxBytes: number): string {
  return `File is too large — this server accepts up to ${formatBytes(maxBytes)} per file.`;
}

export function isFileTooLargeError(error: unknown): boolean {
  const err = error as { code?: string; statusCode?: number } | null;
  return err?.code === "FST_REQ_FILE_TOO_LARGE" || err?.statusCode === 413;
}
