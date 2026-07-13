import { Portal } from "./Portal";
import type { UploadController } from "./useUpload";

/** Missing-date modal + upload progress toast for a useUpload controller. */
export function UploadOverlays({ upload }: { upload: UploadController }) {
  const {
    uploads,
    missingDateIds,
    fallbackDate,
    setFallbackDate,
    savingDate,
    dateError,
    saveMissingDates,
  } = upload;

  return (
    <Portal>
      {missingDateIds.length > 0 && (
        <div className="fixed inset-0 z-[2100] bg-black/75 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/10 p-5 shadow-2xl animate-scale-in">
            <h2 className="text-white text-lg font-medium">Date needed</h2>
            <p className="mt-1 text-sm text-white/50">
              {missingDateIds.length} uploaded item{missingDateIds.length === 1 ? "" : "s"} had no Apple date.
            </p>

            <div className="mt-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wide text-white/40">Date</span>
                <input
                  type="date"
                  required
                  value={fallbackDate}
                  onChange={(e) => setFallbackDate(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                />
              </label>
            </div>

            {dateError && (
              <p className="mt-3 text-xs text-red-300">{dateError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => void saveMissingDates()}
                disabled={!fallbackDate || savingDate}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-bright disabled:opacity-40 tap"
              >
                {savingDate ? "Saving..." : "Save date"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress toast */}
      {uploads.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-[2050] bg-neutral-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 w-72 space-y-2 animate-slide-up"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <p className="text-white/60 text-xs font-medium mb-2">Uploading {uploads.length} item{uploads.length !== 1 ? "s" : ""}…</p>
          {uploads.map((u, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span className="truncate max-w-[180px]">{u.name}</span>
                <span>{u.error ? "Error" : u.done ? "Done" : `${Math.round((u.loaded / u.total) * 100)}%`}</span>
              </div>
              {u.error && (
                <p className="mb-1 text-xs leading-snug text-red-300 break-words">
                  {u.error}
                </p>
              )}
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${u.error ? "bg-red-400" : "bg-accent-bright"}`}
                  style={{ width: `${Math.round((u.loaded / u.total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Portal>
  );
}
