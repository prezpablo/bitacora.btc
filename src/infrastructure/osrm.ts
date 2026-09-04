import type { GuideMode } from "@/domain/guide";

export type GuidePath = { lat: number; lon: number }[];

const HOST: Record<GuideMode, string> = {
  foot: "https://routing.openstreetmap.de/routed-foot",
  car: "https://routing.openstreetmap.de/routed-car",
};

export async function fetchOsrmPath(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  mode: GuideMode,
): Promise<GuidePath> {
  const url =
    `${HOST[mode]}/route/v1/driving/${from.lon.toFixed(6)},${from.lat.toFixed(6)};` +
    `${to.lon.toFixed(6)},${to.lat.toFixed(6)}?overview=full&geometries=geojson`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0 (mapa Bitcoin; +https://bitacorabtc.org)" },
    signal: AbortSignal.timeout(12_000),
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
