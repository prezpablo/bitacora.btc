import { geodesicLine, type GuideMode, type GuidePt } from "@/domain/guide";

export type GuidePath = GuidePt[];

const HOST: Record<GuideMode, string> = {
  foot: "https://routing.openstreetmap.de/routed-foot",
  car: "https://routing.openstreetmap.de/routed-car",
};

const UA = "bitacora.btc/1.0 (mapa Bitcoin; +https://bitacorabtc.org)";

async function fetchOsrmPath(from: GuidePt, to: GuidePt, mode: GuideMode): Promise<GuidePath> {
  const url =
    `${HOST[mode]}/route/v1/driving/${from.lon.toFixed(6)},${from.lat.toFixed(6)};` +
    `${to.lon.toFixed(6)},${to.lat.toFixed(6)}?overview=full&geometries=geojson`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`osrm ${res.status}`);
  const json = (await res.json()) as {
    code?: string;
    routes?: { geometry?: { coordinates?: [number, number][] } }[];
  };
  if (json.code && json.code !== "Ok") throw new Error(json.code);
  const coords = json.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) throw new Error("empty");
  return coords
    .map(([lon, lat]) => ({ lat, lon }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
}

async function fetchValhallaPath(from: GuidePt, to: GuidePt, mode: GuideMode): Promise<GuidePath> {
  const res = await fetch("https://valhalla1.openstreetmap.de/route", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(8_000),
    body: JSON.stringify({
      locations: [
        { lat: from.lat, lon: from.lon },
        { lat: to.lat, lon: to.lon },
      ],
      costing: mode === "car" ? "auto" : "pedestrian",
      shape_format: "geojson",
    }),
  });
  if (!res.ok) throw new Error(`valhalla ${res.status}`);
  const json = (await res.json()) as {
    trip?: { legs?: { shape?: string; geometry?: { coordinates?: [number, number][] } }[] };
  };
  const geo = json.trip?.legs?.[0]?.geometry?.coordinates;
  if (geo?.length) {
    return geo.map(([lon, lat]) => ({ lat, lon })).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  }
  throw new Error("empty");
}

export async function fetchGuidePath(from: GuidePt, to: GuidePt, mode: GuideMode): Promise<GuidePath> {
  const order: GuideMode[] = mode === "car" ? ["car", "foot"] : ["foot", "car"];
  for (const m of order) {
    try {
      const path = await fetchOsrmPath(from, to, m);
      if (path.length >= 2) return path;
    } catch {
      /* next */
    }
  }
  try {
    const path = await fetchValhallaPath(from, to, mode);
    if (path.length >= 2) return path;
  } catch {
    /* geodesic */
  }
  return geodesicLine(from, to);
}
