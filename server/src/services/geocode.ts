interface GeoResult {
  city: string | null;
  country: string | null;
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
