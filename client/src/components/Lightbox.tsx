import { useEffect, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { format } from "date-fns";
import type { Photo } from "../types";
import { originalUrl } from "../api";

interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ photos, index, onClose, onNavigate }: Props) {
  const photo = photos[index];

  const prev = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  const next = useCallback(() => {
    if (index < photos.length - 1) onNavigate(index + 1);
  }, [index, photos.length, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: next,
    onSwipedRight: prev,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  if (!photo) return null;

  const ts = photo.dateTaken ?? photo.dateUploaded;
  const dateStr = format(new Date(ts), "MMMM d, yyyy · h:mm a");
  const location = [photo.city, photo.country].filter(Boolean).join(", ");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      {...swipeHandlers}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white/50 text-sm">
          {index + 1} / {photos.length}
        </span>
        <div className="w-9" />
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {index > 0 && (
          <button
            onClick={prev}
            className="absolute left-4 z-10 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <img
          key={photo.id}
          src={originalUrl(photo)}
          alt={photo.originalName}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />

        {index < photos.length - 1 && (
          <button
            onClick={next}
            className="absolute right-4 z-10 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 shrink-0 text-center">
        <p className="text-white/60 text-sm">{dateStr}</p>
        {location && <p className="text-white/40 text-xs mt-1">{location}</p>}
        <p className="text-white/30 text-xs mt-1 truncate max-w-xs mx-auto">{photo.originalName}</p>
      </div>
    </div>
  );
}
