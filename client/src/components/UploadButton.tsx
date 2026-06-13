import { useRef, useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { missingDatePhotoIds, uploadResultError } from "../uploadResult";
import { dateInputToTimestamp } from "./photoDate";

function localDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface UploadItem {
  name: string;
  loaded: number;
  total: number;
  done: boolean;
  error?: string;
}

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [missingDateIds, setMissingDateIds] = useState<string[]>([]);
  const [fallbackDate, setFallbackDate] = useState(() => localDateInputValue(new Date()));
  const [savingDate, setSavingDate] = useState(false);
  const [dateError, setDateError] = useState("");
  const queryClient = useQueryClient();

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const items: UploadItem[] = files.map((f) => ({
        name: f.name,
        loaded: 0,
        total: f.size,
        done: false,
      }));
      setUploads((prev) => [...prev, ...items]);

      try {
        const results = await api.upload(files, (loaded, total) => {
          setUploads((prev) =>
            prev.map((item, i) =>
              i >= prev.length - files.length
                ? { ...item, loaded: Math.round((loaded / total) * item.total), total: item.total }
                : item
            )
          );
        });
        // Mark each file done or errored based on per-file server result
        setUploads((prev) => {
          const offset = prev.length - files.length;
          return prev.map((item, i) => {
            if (i < offset) return item;
            const result = results[i - offset];
            return result?.ok
              ? { ...item, done: true, loaded: item.total }
              : { ...item, error: result ? uploadResultError(result) : "Upload failed" };
          });
        });
        if (results.some((r) => r.ok)) {
          queryClient.invalidateQueries({ queryKey: ["timeline"] });
          queryClient.invalidateQueries({ queryKey: ["map-photos"] });
        }
        const ids = missingDatePhotoIds(results);
        if (ids.length) {
          setMissingDateIds(ids);
          setDateError("");
        }
        setTimeout(() => setUploads((prev) => prev.filter((u) => !u.done)), 2500);
      } catch (err) {
        setUploads((prev) =>
          prev.map((item, i) =>
            i >= prev.length - files.length
              ? { ...item, error: String(err) }
              : item
          )
        );
      }
    },
    [queryClient]
  );

  const stageFiles = useCallback((files: File[]) => {
    if (!files.length) return;
    void uploadFiles(files);
  }, [uploadFiles]);

  const saveMissingDates = useCallback(async () => {
    if (!missingDateIds.length || !fallbackDate || savingDate) return;

    setSavingDate(true);
    setDateError("");
    try {
      const dateTaken = dateInputToTimestamp(fallbackDate);
      await Promise.all(
        missingDateIds.map((id) => api.photos.update(id, { dateTaken })),
      );
      setMissingDateIds([]);
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      queryClient.invalidateQueries({ queryKey: ["map-photos"] });
    } catch (err) {
      setDateError(err instanceof Error ? err.message : "Could not save date");
    } finally {
      setSavingDate(false);
    }
  }, [fallbackDate, missingDateIds, queryClient, savingDate]);

  // Global drag-drop
  useEffect(() => {
    const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = () => setDragging(false);
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
      );
      stageFiles(files);
    };
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [stageFiles]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          stageFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add photos
      </button>

      {missingDateIds.length > 0 && (
        <div className="fixed inset-0 z-[2100] bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/10 p-5 shadow-2xl">
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
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
              >
                {savingDate ? "Saving..." : "Save date"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 border-4 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
          <div className="text-white text-2xl font-medium">Drop photos & videos to upload</div>
        </div>
      )}

      {/* Upload progress toast */}
      {uploads.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 bg-neutral-800 rounded-xl shadow-2xl p-4 w-72 space-y-2">
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
                  className={`h-full rounded-full transition-all ${u.error ? "bg-red-400" : "bg-blue-400"}`}
                  style={{ width: `${Math.round((u.loaded / u.total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
