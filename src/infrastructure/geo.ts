/** GPS (gesto) → IP del usuario (geojs, CORS *) → recuadro de ciudad (Nominatim en server). */

export type GeoFix = {
  lat: number;
  lon: number;
  accuracy: number;
  city?: string;
  source: "gps" | "ip";
};

export type CityFrame = {
  lat: number;
  lon: number;
  south: number;
  north: number;
  west: number;
  east: number;
  label: string;
};

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function boxAround(lat: number, lon: number, label = "ciudad"): CityFrame {
  return {
    lat,
    lon,
    south: lat - 0.14,
    north: lat + 0.14,
    west: lon - 0.18,
    east: lon + 0.18,
    label,
  };
}

export function requestGps(): Promise<GeoFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("no-geo"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 80,
          source: "gps",
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 0 },
    );
  });
}

async function ipFrom(url: string, pick: (j: Record<string, unknown>) => GeoFix | null): Promise<GeoFix> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as Record<string, unknown>;
    const fix = pick(j);
    if (!fix) throw new Error("ip-geo");
    return fix;
  } finally {
    clearTimeout(t);
  }
}

export async function requestIpFix(): Promise<GeoFix> {
  try {
    return await ipFrom("https://get.geojs.io/v1/ip/geo.json", (j) => {
      const lat = num(j.latitude);
      const lon = num(j.longitude);
      if (lat == null || lon == null) return null;
      return {
        lat,
        lon,
        accuracy: 12_000,
        city: [j.city, j.country].filter(Boolean).join(", "),
        source: "ip",
      };
    });
  } catch {
    return ipFrom("https://ipwho.is/", (j) => {
      if (j.success === false) return null;
      const lat = num(j.latitude);
      const lon = num(j.longitude);
      if (lat == null || lon == null) return null;
      return {
        lat,
        lon,
        accuracy: 12_000,
        city: [j.city, j.country].filter(Boolean).join(", "),
        source: "ip",
      };
    });
  }
}

export async function nominatimCity(lat: number, lon: number): Promise<CityFrame> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=10&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "bitacora.btc/1.0 (https://bitacora.btc)",
    },
  });
  if (!res.ok) throw new Error(String(res.status));
  const j = (await res.json()) as {
    boundingbox?: string[];
    name?: string;
    address?: { city?: string; town?: string; village?: string; municipality?: string };
  };
  const bb = j.boundingbox;
  const south = bb ? Number(bb[0]) : lat - 0.14;
  const north = bb ? Number(bb[1]) : lat + 0.14;
  const west = bb ? Number(bb[2]) : lon - 0.18;
  const east = bb ? Number(bb[3]) : lon + 0.18;
  const label =
    j.address?.city || j.address?.town || j.address?.village || j.address?.municipality || j.name || "ciudad";
  return { lat, lon, south, north, west, east, label };
}

export async function locateBest(
  preferGps: boolean,
  cityOf: (lat: number, lon: number) => Promise<CityFrame>,
): Promise<{ fix: GeoFix; city: CityFrame }> {
  let fix: GeoFix | null = null;
  if (preferGps) {
    try {
      fix = await requestGps();
    } catch {
      fix = null;
    }
  }
  if (!fix) fix = await requestIpFix();
  const city = await cityOf(fix.lat, fix.lon).catch(() => boxAround(fix!.lat, fix!.lon, fix!.city));
  return { fix, city };
}
