import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, thumbnailUrl } from "../api";
import { RevealImage } from "../components/RevealImage";

export function AlbumsPage() {
  const queryClient = useQueryClient();
  const { data: albums, isLoading } = useQuery({
    queryKey: ["albums"],
    queryFn: api.albums.list,
  });

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const createMutation = useMutation({
    mutationFn: (name: string) => api.albums.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setCreating(false);
      setNewName("");
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="h-6 w-28 rounded-lg skeleton mb-6" />
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square rounded-xl skeleton mb-2" style={{ animationDelay: `${i * 90}ms` }} />
              <div className="h-3 w-2/3 rounded-full skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Albums</h1>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm transition-colors tap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New album
          </button>
        )}
      </div>

      {creating && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createMutation.mutate(newName.trim());
          }}
          className="flex gap-2 mb-6 animate-slide-up"
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Album name"
            className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
          />
          <button
            type="submit"
            disabled={!newName.trim() || createMutation.isPending}
            className="px-4 py-2 bg-accent hover:bg-accent-bright disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors tap"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => { setCreating(false); setNewName(""); }}
            className="px-3 py-2 text-white/40 hover:text-white text-sm rounded-lg hover:bg-white/10 transition-colors tap"
          >
            Cancel
          </button>
        </form>
      )}

      {!albums?.length && !creating ? (
        <div className="text-center text-white/30 py-20 text-sm">
          No albums yet — create one to organize your photos
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
        >
          {albums?.map((album) => (
            <Link key={album.id} to={`/albums/${album.id}`} className="group tap block">
              <div className="aspect-square rounded-xl overflow-hidden bg-white/5 mb-2 shadow-lg shadow-black/20">
                {album.coverPhotoId ? (
                  <RevealImage
                    src={thumbnailUrl({ id: album.coverPhotoId })}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-white/80 text-sm font-medium truncate group-hover:text-white transition-colors">
                {album.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
