export type GuideMode = "foot" | "car";
export type GuidePt = { lat: number; lon: number };

export function kmBetween(a: GuidePt, b: GuidePt) {
  const dlat = (b.lat - a.lat) * 111.32;
  const dlon = (b.lon - a.lon) * 111.32 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dlat, dlon);
}

export function pickGuideMode(from: GuidePt, to: GuidePt): GuideMode {
  return kmBetween(from, to) > 8 ? "car" : "foot";
}

/** Always-on fallback: stay on Bitácora's map, never OSM.org. */
export function geodesicLine(from: GuidePt, to: GuidePt, steps = 16): GuidePt[] {
  const out: GuidePt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push({ lat: from.lat + (to.lat - from.lat) * t, lon: from.lon + (to.lon - from.lon) * t });
  }
  return out;
}

export function geoUri(to: GuidePt, name: string) {
  const q = `${to.lat.toFixed(6)},${to.lon.toFixed(6)}(${name.replace(/[()]/g, "")})`;
  return `geo:${to.lat.toFixed(6)},${to.lon.toFixed(6)}?q=${encodeURIComponent(q)}`;
}
