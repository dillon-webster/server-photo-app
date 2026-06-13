import { useEffect, useCallback, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Photo } from "../types";
import { originalUrl, api } from "../api";
import { LIGHTBOX_LAYER_CLASS } from "./lightboxLayer";
import { MapPicker } from "./MapPicker";
import { dateInputToTimestamp, timestampToDateInput } from "./photoDate";
import { savePhotoLocation } from "./photoLocation";


interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ photos, index, onClose, onNavigate }: Props) {
  const [livePhoto, setLivePhoto] = useState<Photo | null>(null);
  const photo = livePhoto ?? photos[index];
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editLocationSearch, setEditLocationSearch] = useState("");

  const prev = useCallback(() => {
    if (index > 0) { setEditing(false); setLivePhoto(null); onNavigate(index - 1); }
  }, [index, onNavigate]);

  const next = useCallback(() => {
    if (index < photos.length - 1) { setEditing(false); setLivePhoto(null); onNavigate(index + 1); }
  }, [index, photos.length, onNavigate]);

  const startEditing = useCallback(() => {
    setEditDate(photo.dateTaken != null ? timestampToDateInput(photo.dateTaken) : "");
    setEditLocationSearch([photo.city, photo.country].filter(Boolean).join(", "));
    setEditing(true);
  }, [photo]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await api.photos.update(photo.id, {
        dateTaken: editDate ? dateInputToTimestamp(editDate) : null,
        locationSearch: editLocationSearch.trim() || null,
      });
      setLivePhoto(updated);
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      queryClient.invalidateQueries({ queryKey: ["map-photos"] });
      queryClient.invalidateQueries({ queryKey: ["album"] });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [photo.id, editDate, editLocationSearch, queryClient]);

  const handleLocationConfirm = useCallback(async (lat: number, lon: number) => {
    const updated = await savePhotoLocation(api.photos.update, photo.id, lat, lon);
    setLivePhoto(updated);
    setEditLocationSearch([updated.city, updated.country].filter(Boolean).join(", "));
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["timeline"] }),
      queryClient.invalidateQueries({ queryKey: ["map-photos"] }),
      queryClient.invalidateQueries({ queryKey: ["album"] }),
    ]);
    setShowMapPicker(false);
    setEditing(false);
  }, [photo.id, queryClient]);

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
      className={`fixed inset-0 ${LIGHTBOX_LAYER_CLASS} bg-black/95 flex flex-col`}
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
          <div className="flex flex-col gap-2 w-64 mx-auto">
            <div className="flex flex-col gap-1">
              <span className="text-white/30 text-xs uppercase tracking-wide">Date</span>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-white/30 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/30 text-xs uppercase tracking-wide">Location</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search for a place…"
                  value={editLocationSearch}
                  onChange={e => setEditLocationSearch(e.target.value)}
                  className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-white/30 focus:outline-none placeholder:text-white/25 min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  title="Pick on map"
                  className="text-white/40 hover:text-white/80 p-2 bg-white/10 hover:bg-white/15 rounded-lg transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setEditing(false)}
                className="text-white/40 text-sm px-4 py-1.5 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-white text-sm px-4 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-colors disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
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

      {showMapPicker && (
        <MapPicker
          initialLat={photo.latitude}
          initialLon={photo.longitude}
          onConfirm={handleLocationConfirm}
          onCancel={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}
