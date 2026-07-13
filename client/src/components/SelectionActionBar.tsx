import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { Portal } from "./Portal";
import { useSelection } from "./SelectionContext";

// Bottom bar shown while selecting photos on the timeline: bulk add-to-album
// and bulk delete for the current selection.
export function SelectionActionBar() {
  const { selecting, selected, cancel } = useSelection();
  const queryClient = useQueryClient();
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!selecting) return null;
  const count = selected.size;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["timeline"] });
    queryClient.invalidateQueries({ queryKey: ["map-photos"] });
    queryClient.invalidateQueries({ queryKey: ["albums"] });
  };

  const handleDelete = async () => {
    if (!count || deleting) return;
    if (!confirm(`Delete ${count} photo${count === 1 ? "" : "s"}? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => api.photos.delete(id)));
      invalidateAll();
      cancel();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Portal>
        <div className="fixed z-[1000] inset-x-0 bottom-0 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6 animate-slide-up">
          <div
            className="flex items-center gap-3 bg-neutral-800/95 backdrop-blur-xl border-t border-white/10 sm:border sm:rounded-2xl px-4 py-3 shadow-2xl"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <span className="text-white/60 text-sm min-w-[5.5rem]">
              {count} selected
            </span>
            <button
              disabled={!count}
              onClick={() => setShowAlbumPicker(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-sm font-medium transition-colors tap"
            >
              Add to Album
            </button>
            <button
              disabled={!count || deleting}
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 disabled:opacity-40 text-red-300 text-sm font-medium transition-colors tap"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Portal>

      {showAlbumPicker && (
        <AlbumPicker
          photoIds={[...selected]}
          onClose={() => setShowAlbumPicker(false)}
          onAdded={() => {
            setShowAlbumPicker(false);
            invalidateAll();
            cancel();
          }}
        />
      )}
    </>
  );
}

function AlbumPicker({
  photoIds,
  onClose,
  onAdded,
}: {
  photoIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const { data: albums, isLoading } = useQuery({ queryKey: ["albums"], queryFn: api.albums.list });
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const addTo = async (albumId: string) => {
    if (busyId) return;
    setBusyId(albumId);
    try {
      await api.albums.addPhotos(albumId, photoIds);
      onAdded();
    } finally {
      setBusyId(null);
    }
  };

  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name || busyId) return;
    setBusyId("new");
    try {
      const album = await api.albums.create(name);
      await api.albums.addPhotos(album.id, photoIds);
      onAdded();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[1100] bg-black/70 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-sm bg-neutral-900 border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-slide-up max-h-[75vh] flex flex-col"
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-base font-semibold">
              Add {photoIds.length} to album
            </h2>
            <button onClick={onClose} className="text-white/40 hover:text-white text-sm tap">
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            {isLoading ? (
              <p className="text-white/40 text-sm py-6 text-center">Loading…</p>
            ) : albums?.length ? (
              <div className="space-y-1">
                {albums.map((a) => (
                  <button
                    key={a.id}
                    disabled={busyId !== null}
                    onClick={() => addTo(a.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 disabled:opacity-50 text-left transition-colors tap"
                  >
                    <span className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/30 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <span className="text-white/90 text-sm font-medium truncate flex-1">{a.name}</span>
                    {busyId === a.id && <span className="text-white/40 text-xs shrink-0">Adding…</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm py-6 text-center">No albums yet — create one below.</p>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-white/10">
            {creating ? (
              <form onSubmit={(e) => { e.preventDefault(); void createAndAdd(); }} className="flex gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New album name"
                  className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
                />
                <button
                  type="submit"
                  disabled={!newName.trim() || busyId !== null}
                  className="px-4 py-2 bg-accent hover:bg-accent-bright disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors tap"
                >
                  {busyId === "new" ? "Adding…" : "Create"}
                </button>
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors tap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New album
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
