export type GuideMode = "foot" | "car";

export function pickGuideMode(from: { lat: number; lon: number }, to: { lat: number; lon: number }): GuideMode {
  const dlat = (to.lat - from.lat) * 111.32;
  const dlon = (to.lon - from.lon) * 111.32 * Math.cos((from.lat * Math.PI) / 180);
  const km = Math.hypot(dlat, dlon);
  return km > 8 ? "car" : "foot";
}

export function osmDirectionsUrl(
  to: { lat: number; lon: number },
  from?: { lat: number; lon: number } | null,
  mode: GuideMode = "foot",
) {
  const engine = mode === "car" ? "fossgis_osrm_car" : "fossgis_osrm_foot";
  const route = from
    ? `${from.lat.toFixed(6)},${from.lon.toFixed(6)};${to.lat.toFixed(6)},${to.lon.toFixed(6)}`
    : `${to.lat.toFixed(6)},${to.lon.toFixed(6)}`;
  return `https://www.openstreetmap.org/directions?engine=${engine}&route=${encodeURIComponent(route)}`;
}

export function geoUri(to: { lat: number; lon: number }, name: string) {
  const q = `${to.lat.toFixed(6)},${to.lon.toFixed(6)}(${name.replace(/[()]/g, "")})`;
  return `geo:${to.lat.toFixed(6)},${to.lon.toFixed(6)}?q=${encodeURIComponent(q)}`;
}
