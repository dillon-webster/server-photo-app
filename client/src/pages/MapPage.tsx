import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { api, thumbnailUrl, originalUrl } from "../api";
import { Lightbox } from "../components/Lightbox";
import type { Photo } from "../types";

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

  const center: [number, number] = [data[0].latitude, data[0].longitude];

  return (
    <>
      <div className="h-[calc(100vh-49px)]">
        <MapContainer
          center={center}
          zoom={4}
          className="w-full h-full"
          style={{ background: "#1a1a1a" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MarkerClusterGroup chunkedLoading>
            {data.map((photo) => (
              <Marker key={photo.id} position={[photo.latitude, photo.longitude]}>
                <Popup>
                  <div className="w-32">
                    <img
                      src={thumbnailUrl(photo)}
                      alt=""
                      className="w-full h-24 object-cover rounded cursor-pointer"
                      onClick={() => {
                        const fullPhoto: Photo = {
                          ...photo,
                          originalName: photo.filename,
                          mimeType: "image/jpeg",
                          size: 0,
                          width: 0,
                          height: 0,
                          dateUploaded: photo.dateTaken ?? Date.now(),
                        };
                        setLightboxPhotos([fullPhoto]);
                        setLightboxPhoto(fullPhoto);
                      }}
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
