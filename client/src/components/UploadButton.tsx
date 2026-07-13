import { useRef, useState, useEffect } from "react";
import { useUpload } from "./useUpload";
import { UploadOverlays } from "./UploadOverlays";

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const upload = useUpload();
  const { stageFiles } = upload;

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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-bright text-white text-sm font-medium transition-colors tap"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">Add photos</span>
      </button>

      {/* Drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-accent/20 border-4 border-dashed border-accent-bright flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="text-white text-2xl font-medium animate-scale-in">Drop photos &amp; videos to upload</div>
        </div>
      )}

      <UploadOverlays upload={upload} />
    </>
  );
}
