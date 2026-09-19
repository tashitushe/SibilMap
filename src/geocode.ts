export interface Place { label: string; city: string; country: string; lat: number; lon: number; }

export async function searchPlaces(q: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Search failed");
  const rows = (await res.json()) as any[];
  const out = rows.map((r) => {
    const a = r.address ?? {};
    return {
      label: r.display_name as string,
      city: a.city || a.town || a.village || a.municipality || r.name || "",
      country: a.country || "",
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    };
  });
  return out.filter((p, i) => out.findIndex((q) => q.label === p.label) === i);
}

export function formatCoords(lat: number, lon: number) {
  const f = (v: number, p: string, n: string) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? p : n}`;
  return `${f(lat, "N", "S")} / ${f(lon, "E", "W")}`;
}
