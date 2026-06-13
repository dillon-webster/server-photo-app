import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface Props {
  initialLat?: number | null;
  initialLon?: number | null;
  onConfirm: (lat: number, lon: number) => Promise<void>;
  onCancel: () => void;
}

export function MapPicker({ initialLat, initialLon, onConfirm, onCancel }: Props) {
  const hasInitial = initialLat != null && initialLon != null;
  const [pin, setPin] = useState<{ lat: number; lon: number } | null>(
    hasInitial ? { lat: initialLat!, lon: initialLon! } : null
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleConfirm() {
    if (!pin) return;

    setSaving(true);
    setSaveError("");
    try {
      await onConfirm(pin.lat, pin.lon);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save location");
    } finally {
      setSaving(false);
    }
  }

  const center: [number, number] = hasInitial ? [initialLat!, initialLon!] : [20, 0];
  const zoom = hasInitial ? 10 : 2;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ background: "#1a1a1a" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onPick={(lat, lon) => setPin({ lat, lon })} />
        {pin && (
          <Marker
            position={[pin.lat, pin.lon]}
            draggable
            eventHandlers={{
              dragend(e) {
                const pos = e.target.getLatLng();
                setPin({ lat: pos.lat, lon: pos.lng });
              },
            }}
          />
        )}
      </MapContainer>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2001] bg-black/70 text-white text-sm px-4 py-2 rounded-full pointer-events-none select-none">
        {pin ? "Drag the pin to adjust" : "Tap anywhere to place a pin"}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2001] flex gap-3 items-center">
        {saveError && (
          <p className="absolute bottom-full mb-3 whitespace-nowrap rounded-lg bg-red-950/90 px-3 py-2 text-sm text-red-200">
            {saveError}
          </p>
        )}
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-5 py-2 bg-black/70 backdrop-blur text-white/70 rounded-full hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
        {pin && (
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors text-sm font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Use this location"}
          </button>
        )}
      </div>
    </div>
  );
}
