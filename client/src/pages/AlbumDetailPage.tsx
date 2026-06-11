import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { PhotoGrid } from "../components/PhotoGrid";
import type { Photo } from "../types";

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: album, isLoading } = useQuery({
    queryKey: ["album", id],
    queryFn: () => api.albums.get(id!),
    enabled: !!id,
  });

  const { data: timeline } = useQuery({
    queryKey: ["timeline"],
    queryFn: api.photos.timeline,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const addMutation = useMutation({
    mutationFn: (photoIds: string[]) => api.albums.addPhotos(id!, photoIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["album", id] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setShowAddModal(false);
      setSelected(new Set());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.albums.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      navigate("/albums");
    },
  });

  if (isLoading || !album) {
    return <div className="flex items-center justify-center h-64 text-white/30">Loading…</div>;
  }

  // All photos from timeline for the "add" modal
  const allPhotos: Photo[] = timeline?.flatMap((y) => y.months.flatMap((m) => m.photos)) ?? [];
  const albumPhotoIds = new Set(album.photos.map((p) => p.id));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button
          onClick={() => navigate("/albums")}
          className="text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white flex-1">{album.name}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add photos
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete album "${album.name}"?`)) deleteMutation.mutate();
          }}
          className="px-3 py-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 text-sm transition-colors"
        >
          Delete
        </button>
      </div>

      {album.photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-white/30 gap-2 text-sm">
          <p>No photos in this album yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Add some photos
          </button>
        </div>
      ) : (
        <PhotoGrid photos={album.photos} />
      )}

      {/* Add photos modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-40 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-white/10 shrink-0">
            <button
              onClick={() => { setShowAddModal(false); setSelected(new Set()); }}
              className="text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <span className="text-white text-sm font-medium">
              {selected.size > 0 ? `${selected.size} selected` : "Select photos"}
            </span>
            <button
              disabled={selected.size === 0 || addMutation.isPending}
              onClick={() => addMutation.mutate(Array.from(selected))}
              className="text-blue-400 hover:text-blue-300 disabled:opacity-40 text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PhotoGrid
              photos={allPhotos.filter((p) => !albumPhotoIds.has(p.id))}
              selectable
              selected={selected}
              onSelect={(id) =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) {
                    next.delete(id);
                  } else {
                    next.add(id);
                  }
                  return next;
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
