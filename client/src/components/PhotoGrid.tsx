import { useState } from "react";
import type { Photo } from "../types";
import { thumbnailUrl } from "../api";
import { Lightbox } from "./Lightbox";

function formatDuration(ms: number): string {
  const secs = Math.round(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface Props {
  photos: Photo[];
  selectable?: boolean;
  selected?: Set<string>;
  onSelect?: (id: string) => void;
}

export function PhotoGrid({ photos, selectable, selected, onSelect }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
      >
        {photos.map((photo, i) => {
          const isSelected = selected?.has(photo.id);
          return (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden cursor-pointer group"
              onClick={() => {
                if (selectable) {
                  onSelect?.(photo.id);
                } else {
                  setLightboxIndex(i);
                }
              }}
            >
              <img
                src={thumbnailUrl(photo)}
                alt={photo.originalName}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              {photo.mimeType.startsWith("video/") && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {photo.duration != null && (
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded pointer-events-none">
                      {formatDuration(photo.duration)}
                    </div>
                  )}
                </>
              )}
              {selectable && (
                <div className={`absolute inset-0 transition-colors ${isSelected ? "bg-blue-500/40" : "bg-transparent group-hover:bg-white/10"}`}>
                  <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-blue-500 border-blue-500" : "border-white/70 bg-black/20"}`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
