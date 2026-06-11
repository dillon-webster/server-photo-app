import { useEffect, useCallback, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Photo } from "../types";
import { originalUrl, api } from "../api";

function toDatetimeLocal(ts: number) {
  return format(new Date(ts), "yyyy-MM-dd'T'HH:mm");
}

interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ photos, index, onClose, onNavigate }: Props) {
  const photo = photos[index];
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editLocationSearch, setEditLocationSearch] = useState("");

  const prev = useCallback(() => {
    if (index > 0) { setEditing(false); onNavigate(index - 1); }
  }, [index, onNavigate]);

  const next = useCallback(() => {
    if (index < photos.length - 1) { setEditing(false); onNavigate(index + 1); }
  }, [index, photos.length, onNavigate]);

  const startEditing = useCallback(() => {
    setEditDate(photo.dateTaken ? toDatetimeLocal(photo.dateTaken) : "");
    setEditCity(photo.city ?? "");
    setEditCountry(photo.country ?? "");
    setEditLocationSearch("");
    setEditing(true);
  }, [photo]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await api.photos.update(photo.id, {
        dateTaken: editDate || null,
        city: editCity.trim() || null,
        country: editCountry.trim() || null,
        locationSearch: editLocationSearch.trim() || null,
      });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      queryClient.invalidateQueries({ queryKey: ["map-photos"] });
      queryClient.invalidateQueries({ queryKey: ["album"] });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [photo.id, editDate, editCity, editCountry, editLocationSearch, queryClient]);

  const handleDelete = useCallback(async () => {
    if (!photo || !confirm(`Delete "${photo.originalName}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await api.photos.delete(photo.id);
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      queryClient.invalidateQueries({ queryKey: ["map-photos"] });
      queryClient.invalidateQueries({ queryKey: ["album"] });
      // Navigate to next photo, or prev if this was the last, or close
      if (photos.length === 1) {
        onClose();
      } else if (index < photos.length - 1) {
        onNavigate(index); // same index now points to next photo after re-render
      } else {
        onNavigate(index - 1);
      }
    } finally {
      setDeleting(false);
    }
  }, [photo, index, photos.length, onClose, onNavigate, queryClient]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Delete" || e.key === "Backspace") handleDelete();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next, handleDelete]);

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
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-white/40 hover:text-red-400 disabled:opacity-30 p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Delete photo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
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

        {photo.mimeType.startsWith("video/") ? (
          <video
            key={photo.id}
            src={originalUrl(photo)}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-full select-none"
          />
        ) : (
          <img
            key={photo.id}
            src={originalUrl(photo)}
            alt={photo.originalName}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        )}

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
        {editing ? (
          <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
            <input
              type="datetime-local"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              className="bg-white/10 text-white text-sm rounded px-2 py-1 w-full border border-white/20"
            />
            <input
              type="text"
              placeholder="Search location (e.g. Delta Center, Salt Lake City)"
              value={editLocationSearch}
              onChange={e => setEditLocationSearch(e.target.value)}
              className="bg-white/10 text-white text-sm rounded px-2 py-1 w-full border border-white/20 placeholder:text-white/30"
            />
            <div className="flex gap-2 w-full">
              <input
                type="text"
                placeholder="City"
                value={editCity}
                onChange={e => setEditCity(e.target.value)}
                className="bg-white/10 text-white text-sm rounded px-2 py-1 flex-1 border border-white/20 placeholder:text-white/30"
              />
              <input
                type="text"
                placeholder="Country"
                value={editCountry}
                onChange={e => setEditCountry(e.target.value)}
                className="bg-white/10 text-white text-sm rounded px-2 py-1 flex-1 border border-white/20 placeholder:text-white/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-white text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-white/60 text-xs px-3 py-1 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-white/60 text-sm">{dateStr}</p>
              <button
                onClick={startEditing}
                className="text-white/30 hover:text-white/70 transition-colors"
                title="Edit date & location"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            {location && <p className="text-white/40 text-xs mt-1">{location}</p>}
            <p className="text-white/30 text-xs mt-1 truncate max-w-xs mx-auto">{photo.originalName}</p>
          </>
        )}
      </div>
    </div>
  );
}
