export type GuideMode = "foot" | "car";
export type GuidePt = { lat: number; lon: number };

export function pickGuideMode(from: GuidePt, to: GuidePt): GuideMode {
  const dlat = (to.lat - from.lat) * 111.32;
  const dlon = (to.lon - from.lon) * 111.32 * Math.cos((from.lat * Math.PI) / 180);
  const km = Math.hypot(dlat, dlon);
  return km > 8 ? "car" : "foot";
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
