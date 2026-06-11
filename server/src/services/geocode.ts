interface GeoResult {
  city: string | null;
  country: string | null;
}

interface LatLon {
  latitude: number;
  longitude: number;
}

// Rounded to ~1km precision to maximize cache hits
const cache = new Map<string, GeoResult>();

function cacheKey(lat: number, lon: number) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

// Nominatim allows ~1 req/sec — enforce that between live fetches
let lastFetchAt = 0;
async function throttledFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = 1100 - (now - lastFetchAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetchAt = Date.now();
  return fetch(url, {
    headers: { "User-Agent": "server-photos/1.0" },
    signal: AbortSignal.timeout(8000),
  });
}

export async function forwardGeocode(query: string): Promise<LatLon | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await throttledFetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    if (!data[0]?.lat || !data[0]?.lon) return null;
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult> {
  const key = cacheKey(lat, lon);
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await throttledFetch(url);

    if (!res.ok) {
      // Don't cache failures — allow retries on future uploads
      return { city: null, country: null };
    }

    const data = (await res.json()) as { address?: Record<string, string> };
    const addr = data.address ?? {};
    const result: GeoResult = {
      city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? null,
      country: addr.country ?? null,
    };
    cache.set(key, result);
    return result;
  } catch {
    // Don't cache failures — allow retries on future uploads
    return { city: null, country: null };
  }
}
