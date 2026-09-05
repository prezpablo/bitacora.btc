import type { GeoFix } from "./geo-frame";

const RANK: Record<GeoFix["source"], number> = { gps: 0, tap: 1, ip: 2 };

export type GpsSession = {
  first: Promise<GeoFix>;
  best: Promise<GeoFix>;
  note: (fix: GeoFix) => void;
};

export function pickBestFix(a: GeoFix | null | undefined, b: GeoFix | null | undefined): GeoFix | null {
  if (!a) return b ?? null;
  if (!b) return a;
  if (RANK[a.source] !== RANK[b.source]) return RANK[a.source] < RANK[b.source] ? a : b;
  return a.accuracy <= b.accuracy ? a : b;
}

export function isPreciseFix(fix: GeoFix) {
  return fix.source === "gps" && fix.accuracy <= 120;
}

export function isUsefulFix(fix: GeoFix) {
  return fix.source === "gps" || fix.source === "tap" || fix.accuracy <= 25_000;
}
