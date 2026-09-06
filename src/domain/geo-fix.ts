import type { GeoFix } from "./geo-frame";

const RANK: Record<GeoFix["source"], number> = { gps: 0, tap: 1, ip: 2 };

export type GpsSession = {
  first: Promise<GeoFix>;
  best: Promise<GeoFix>;
  note: (fix: GeoFix) => void;
};

export type GpsFail = "denied" | "timeout" | "unavailable";

export type GeoCause = "idle" | "wait" | "ok" | "denied" | "timeout" | "unavailable";

export function pickBestFix(a: GeoFix | null | undefined, b: GeoFix | null | undefined): GeoFix | null {
  if (!a) return b ?? null;
  if (!b) return a;
  if (RANK[a.source] !== RANK[b.source]) return RANK[a.source] < RANK[b.source] ? a : b;
  return a.accuracy <= b.accuracy ? a : b;
}

/** Below this, a GPS fix is good enough to draw a street route without the tap-map fallback. */
export const MIN_STREET_ACCURACY_M = 150;

export function isPreciseFix(fix: GeoFix) {
  return fix.source === "gps" && fix.accuracy <= MIN_STREET_ACCURACY_M;
}

export function isUsefulFix(fix: GeoFix) {
  return fix.source === "gps" || fix.source === "tap" || fix.accuracy <= 25_000;
}

export function gpsFailOf(err: unknown): GpsFail {
  const code = err && typeof err === "object" && "code" in err ? Number((err as { code: number }).code) : 0;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (code === 1 || /denied|permission/i.test(msg)) return "denied";
  if (code === 2 || /no-geo|unavailable/i.test(msg)) return "unavailable";
  if (code === 3 || /timeout|no-fix/i.test(msg)) return "timeout";
  return "timeout";
}

export function geoBannerKey(cause: GeoCause): "geoWait" | "geoDenied" | "geoTimeout" | "geoUnavailable" | null {
  if (cause === "wait") return "geoWait";
  if (cause === "denied") return "geoDenied";
  if (cause === "timeout") return "geoTimeout";
  if (cause === "unavailable") return "geoUnavailable";
  return null;
}

export function irFailKey(fail: GpsFail | null): "irDenied" | "irTimeout" | "irUnavailable" | "irTap" {
  if (fail === "denied") return "irDenied";
  if (fail === "timeout") return "irTimeout";
  if (fail === "unavailable") return "irUnavailable";
  return "irTap";
}
