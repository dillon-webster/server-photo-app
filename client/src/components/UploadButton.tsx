import { useRef, useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

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
  const queryClient = useQueryClient();

  const handleFiles = useCallback(
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
              : { ...item, error: "Upload failed" };
          });
        });
        if (results.some((r) => r.ok)) {
          queryClient.invalidateQueries({ queryKey: ["timeline"] });
          queryClient.invalidateQueries({ queryKey: ["map-photos"] });
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

  // Global drag-drop
  useEffect(() => {
    const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = () => setDragging(false);
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
        f.type.startsWith("image/")
      );
      handleFiles(files);
    };
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [handleFiles]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
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

      {/* Drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 border-4 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
          <div className="text-white text-2xl font-medium">Drop photos to upload</div>
        </div>
      )}

      {/* Upload progress toast */}
      {uploads.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 bg-neutral-800 rounded-xl shadow-2xl p-4 w-72 space-y-2">
          <p className="text-white/60 text-xs font-medium mb-2">Uploading {uploads.length} photo{uploads.length !== 1 ? "s" : ""}…</p>
          {uploads.map((u, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span className="truncate max-w-[180px]">{u.name}</span>
                <span>{u.error ? "Error" : u.done ? "Done" : `${Math.round((u.loaded / u.total) * 100)}%`}</span>
              </div>
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
