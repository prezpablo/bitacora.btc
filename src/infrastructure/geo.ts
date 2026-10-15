/** Una sola escucha de GPS. La ciudad por IP es una sola llamada, y solo si el GPS no responde. */

import { MIN_STREET_ACCURACY_M, pickBestFix, type GpsSession } from "@/domain/geo-fix";
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

const GPS_LOCK_M = 30;
const GPS_QUIET_MS = 4_000;
const GPS_WALL_MS = 15_000;

/** Una escucha. La primera muestra mueve el mapa; se queda hasta 30 m, o 15 s. */
export function startGpsFromGesture(): GpsSession {
  let best: GeoFix | null = null;
  let watchId = 0;
  let wall = 0;
  let quiet = 0;
  let firstDone = false;
  let bestDone = false;

  let resolveFirst: (fix: GeoFix) => void = () => {};
  let rejectFirst: (err: unknown) => void = () => {};
  let resolveBest: (fix: GeoFix) => void = () => {};
  let rejectBest: (err: unknown) => void = () => {};

  const first = new Promise<GeoFix>((resolve, reject) => {
    resolveFirst = resolve;
    rejectFirst = reject;
  });
  const bestP = new Promise<GeoFix>((resolve, reject) => {
    resolveBest = resolve;
    rejectBest = reject;
  });

  const finish = (fix: GeoFix | null, err?: unknown) => {
    if (watchId && typeof navigator !== "undefined") navigator.geolocation.clearWatch(watchId);
    watchId = 0;
    window.clearTimeout(wall);
    window.clearTimeout(quiet);
    if (!firstDone) {
      firstDone = true;
      if (fix) resolveFirst(fix);
      else rejectFirst(err ?? new Error("no-fix"));
    }
    if (!bestDone) {
      bestDone = true;
      if (fix) resolveBest(fix);
      else rejectBest(err ?? new Error("no-fix"));
    }
  };

  const note = (fix: GeoFix) => {
    const next = pickBestFix(best, fix);
    if (!next) return;
    best = next;
    if (!firstDone) {
      firstDone = true;
      resolveFirst(best);
    }
    if (bestDone) return;
    if (best.accuracy <= GPS_LOCK_M) {
      finish(best);
      return;
    }
    if (best.accuracy <= MIN_STREET_ACCURACY_M && !quiet) {
      quiet = window.setTimeout(() => {
        if (best) finish(best);
      }, GPS_QUIET_MS);
    }
  };

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    const err = new Error("no-geo");
    queueMicrotask(() => finish(null, err));
    return { first, best: bestP, note };
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => note(fromPos(pos)),
    (err) => finish(best, err),
    { enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000 },
  );
  wall = window.setTimeout(() => finish(best, new Error("no-fix")), GPS_WALL_MS);
  return { first, best: bestP, note };
}

export function requestGpsPrecise(): Promise<GeoFix> {
  return startGpsFromGesture().best;
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

/** Una sola consulta. Si GeoJS no responde, no se prueba otro proveedor. */
export async function requestIpFix(): Promise<GeoFix> {
  return ipFrom("https://get.geojs.io/v1/ip/geo.json", (j) => {
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
