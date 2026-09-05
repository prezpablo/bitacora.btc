/** IP solo para el primer encuadre. Tras el clic (consentimiento), GPS/Wi‑Fi del navegador. */

import { pickBestFix, type GpsSession } from "@/domain/geo-fix";
import { boxAround, frameFromFix, type CityFrame, type GeoFix } from "@/domain/geo-frame";

export type { CityFrame, GeoFix };
export { boxAround, frameFromFix };

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function fromPos(pos: GeolocationPosition): GeoFix {
  return {
    lat: pos.coords.latitude,
    lon: pos.coords.longitude,
    accuracy: pos.coords.accuracy || 80,
    source: "gps",
  };
}

/** Start inside the click handler so the browser shows the GPS prompt. */
export function startGpsFromGesture(): GpsSession {
  let best: GeoFix | null = null;
  const notes: ((f: GeoFix) => void)[] = [];
  const note = (fix: GeoFix) => {
    best = pickBestFix(best, fix);
    if (best) for (const n of notes) n(best);
  };

  const first = new Promise<GeoFix>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("no-geo"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const f = fromPos(pos);
        note(f);
        resolve(f);
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 8_000 },
    );
  });

  const bestP = new Promise<GeoFix>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("no-geo"));
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const f = fromPos(pos);
        note(f);
        if (f.accuracy <= 40 && best) {
          navigator.geolocation.clearWatch(watchId);
          resolve(best);
        }
      },
      (err) => {
        if (best) resolve(best);
        else reject(err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
    notes.push((f) => {
      if (f.accuracy <= 40) {
        navigator.geolocation.clearWatch(watchId);
        resolve(f);
      }
    });
    window.setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      if (best) resolve(best);
      else reject(new Error("no-fix"));
    }, 6_000);
  });

  return { first, best: bestP, note };
}

export function requestGpsOnGesture(): Promise<GeoFix> {
  return startGpsFromGesture().first;
}

export function requestGpsPrecise(): Promise<GeoFix> {
  return startGpsFromGesture().best;
}

export async function requestBeaconFix(ip?: string): Promise<GeoFix> {
  const res = await fetch("https://api.beacondb.net/v1/geolocate", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "bitacora.btc/1.0 (https://bitacorabtc.org)",
      ...(ip ? { "X-Forwarded-For": ip } : {}),
    },
    body: JSON.stringify({ considerIp: true, fallbacks: { ipf: true } }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`beacon ${res.status}`);
  const j = (await res.json()) as { location?: { lat?: number; lng?: number }; accuracy?: number };
  const lat = num(j.location?.lat);
  const lon = num(j.location?.lng);
  if (lat == null || lon == null) throw new Error("beacon");
  return { lat, lon, accuracy: Number(j.accuracy) || 8_000, source: "ip" };
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
        country: String(j.country || ""),
        countryCode: String(j.country_code || "").toUpperCase(),
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
        country: String(j.country || ""),
        countryCode: String(j.country_code || "").toUpperCase(),
        source: "ip",
      };
    });
  }
}

export async function nominatimCity(lat: number, lon: number, zoom = 10): Promise<CityFrame> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=${zoom}&addressdetails=1`;
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
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      country?: string;
      country_code?: string;
    };
  };
  const bb = j.boundingbox;
  const south = bb ? Number(bb[0]) : lat - 0.08;
  const north = bb ? Number(bb[1]) : lat + 0.08;
  const west = bb ? Number(bb[2]) : lon - 0.1;
  const east = bb ? Number(bb[3]) : lon + 0.1;
  const label =
    j.address?.city || j.address?.town || j.address?.village || j.address?.municipality || j.name || "ciudad";
  return {
    lat,
    lon,
    south,
    north,
    west,
    east,
    label,
    country: j.address?.country,
    countryCode: j.address?.country_code?.toUpperCase(),
  };
}

export async function locateBest(
  preferGps: boolean,
  cityOf: (lat: number, lon: number, zoom: number) => Promise<CityFrame>,
): Promise<{ fix: GeoFix; city: CityFrame }> {
  if (preferGps) {
    const fix = await requestGpsPrecise();
    const named = await cityOf(fix.lat, fix.lon, 14).catch(() => null);
    const local = frameFromFix(fix, named?.label);
    const spanLat = named ? named.north - named.south : 99;
    const spanLon = named ? named.east - named.west : 99;
    const city =
      named && spanLat < 0.22 && spanLon < 0.3
        ? { ...named, lat: fix.lat, lon: fix.lon }
        : local;
    if (!city.countryCode && (named?.countryCode || fix.countryCode)) {
      city.countryCode = named?.countryCode || fix.countryCode;
      city.country = named?.country || fix.country;
    }
    return { fix, city };
  }
  const fix = await requestIpFix();
  const city = await cityOf(fix.lat, fix.lon, 10).catch(() => boxAround(fix.lat, fix.lon, fix.city));
  if (!city.countryCode && fix.countryCode) {
    city.countryCode = fix.countryCode;
    city.country = fix.country;
  }
  return { fix, city };
}
