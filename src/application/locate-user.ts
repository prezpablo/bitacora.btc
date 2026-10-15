/** Fuse GPS samples + IP fallback. Call only after a user gesture (Ir / ⊙). */

import { gpsFailOf, pickBestFix, type GpsFail, type GpsSession } from "../domain/geo-fix.ts";
import type { GeoFix } from "../domain/geo-frame.ts";

export type { GpsSession };

type Race = { fix: GeoFix | null; fail: GpsFail | null };

function raceFix(p: Promise<GeoFix>, ms: number): Promise<Race> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve({ fix: null, fail: "timeout" }), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve({ fix: v, fail: null });
      },
      (err) => {
        clearTimeout(t);
        resolve({ fix: null, fail: gpsFailOf(err) });
      },
    );
  });
}

/** Una muestra de GPS alcanza para mover el mapa. La IP entra solo si no hubo ninguna. */
export async function locateOnConsent(
  session: GpsSession,
  fallbacks: { ip: () => Promise<GeoFix | null> },
): Promise<{ fix: GeoFix | null; refine: Promise<GeoFix | null>; gpsFail: GpsFail | null }> {
  const first = await raceFix(session.first, 4_000);
  if (first.fail === "denied" || first.fail === "unavailable") {
    const ip = await fallbacks.ip().catch(() => null);
    return { fix: ip, refine: session.best.catch(() => null), gpsFail: first.fail };
  }
  if (first.fix) {
    return {
      fix: first.fix,
      refine: session.best.then((b) => pickBestFix(first.fix, b), () => first.fix),
      gpsFail: null,
    };
  }
  const watched = await raceFix(session.best, 8_000);
  const gps = watched.fix;
  if (gps) {
    return {
      fix: gps,
      refine: session.best.then((b) => pickBestFix(gps, b), () => gps),
      gpsFail: null,
    };
  }
  const ip = await fallbacks.ip().catch(() => null);
  return {
    fix: ip,
    refine: session.best.catch(() => null),
    gpsFail: watched.fail || first.fail || "timeout",
  };
}
