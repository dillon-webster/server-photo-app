import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { api, thumbnailUrl } from "../api";
import { Lightbox } from "../components/Lightbox";
import type { Photo, MapPhoto } from "../types";

// Fix default marker icons (Leaflet + bundler issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export function MapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["map-photos"],
    queryFn: api.photos.map,
  });

  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);

  const handleOpen = useCallback((p: Photo) => {
    setLightboxPhotos([p]);
    setLightboxPhoto(p);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-white/30">Loading…</div>;
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-3">
        <p className="text-sm">No photos with GPS data yet</p>
      </div>
    );
  }

  const bounds = data.map((p) => [p.latitude, p.longitude] as [number, number]);

  return (
    <>
      <div className="h-[calc(100vh-49px)]">
        <MapContainer
          bounds={bounds}
          boundsOptions={{ padding: [40, 40] }}
          className="w-full h-full"
          style={{ background: "#1a1a1a" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={(cluster: { getChildCount: () => number }) => {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: `<div style="background:#3b82f6;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.4);border:2px solid #fff">${count}</div>`,
                className: "",
                iconSize: [36, 36],
              });
            }}
          >
            {data.map((photo) => (
              <Marker
                key={photo.id}
                position={[photo.latitude, photo.longitude]}
                eventHandlers={{
                  click: () => handleOpen({
                    ...photo,
                    originalName: photo.filename,
                    mimeType: "image/jpeg",
                    size: 0,
                    width: 0,
                    height: 0,
                    duration: null,
                    dateUploaded: photo.dateTaken ?? Date.now(),
                  }),
                }}
              >
                <Popup>
                  <div className="w-32">
                    <img
                      src={thumbnailUrl(photo)}
                      alt=""
                      className="w-full h-24 object-cover rounded"
                    />
                    {(photo.city || photo.country) && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {[photo.city, photo.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {lightboxPhoto && (
        <Lightbox
          photos={lightboxPhotos}
          index={0}
          onClose={() => setLightboxPhoto(null)}
          onNavigate={() => {}}
        />
      )}
    </>
  );
}
