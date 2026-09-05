/** Fuse GPS samples + IP fallback. Call only after a user gesture (Ir / ⊙). */

import { isPreciseFix, pickBestFix, type GpsSession } from "@/domain/geo-fix";
import type { GeoFix } from "@/domain/geo-frame";

export type { GpsSession };

function raceOk(p: Promise<GeoFix>, ms: number): Promise<GeoFix | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(null);
      },
    );
  });
}

export async function locateOnConsent(
  session: GpsSession,
  fallbacks: { ip: () => Promise<GeoFix | null> },
): Promise<{ fix: GeoFix | null; refine: Promise<GeoFix | null> }> {
  const first = await raceOk(session.first, 2_800);
  if (first && isPreciseFix(first)) {
    return { fix: first, refine: session.best.then((b) => pickBestFix(first, b), () => first) };
  }
  const watched = await raceOk(session.best, 5_500);
  const gps = pickBestFix(first, watched);
  if (gps) {
    return { fix: gps, refine: session.best.then((b) => pickBestFix(gps, b), () => gps) };
  }
  const ip = await fallbacks.ip().catch(() => null);
  return { fix: ip, refine: session.best.catch(() => null) };
}
