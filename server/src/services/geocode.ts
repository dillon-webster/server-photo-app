interface GeoResult {
  city: string | null;
  country: string | null;
}

// Rounded to ~1km precision to maximize cache hits
const cache = new Map<string, GeoResult>();

function cacheKey(lat: number, lon: number) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult> {
  const key = cacheKey(lat, lon);
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "server-photos/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      cache.set(key, { city: null, country: null });
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
    cache.set(key, { city: null, country: null });
    return { city: null, country: null };
  }
}
