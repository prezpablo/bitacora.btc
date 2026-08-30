import type { GlobeCountryStat, GlobeDot, GlobeStats } from "@/domain/globe";
import { fetchAllMerchants, fetchBtcCommunities } from "./btc-map";
import { fetchNetworkEvents } from "./events";
import { parseMapCsv } from "@/domain/map-csv";
import { loadMapCsvText } from "./map-csv-io";

const GEO_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson";
const UY_PATCH = "public/data/ne-uy-10m.json";
const CITIES_FILE = "public/data/ne-cities-10m.json";

type NeCity = { iso: string; name: string; lat: number; lon: number };

let cityList: NeCity[] | null = null;

async function loadNeCities(): Promise<NeCity[]> {
  if (cityList) return cityList;
  try {
    const { readFile } = await import("node:fs/promises");
    cityList = JSON.parse(await readFile(CITIES_FILE, "utf8")) as NeCity[];
  } catch {
    cityList = [];
  }
  return cityList;
}

function cityGrid(places: NeCity[]) {
  const grid = new Map<string, NeCity[]>();
  for (const p of places) {
    const k = `${Math.round(p.lat * 2)}_${Math.round(p.lon * 2)}`;
    const arr = grid.get(k);
    if (arr) arr.push(p);
    else grid.set(k, [p]);
  }
  return grid;
}

/** Nearest Natural Earth 10m populated place within ~40 km. */
function nearestCity(grid: Map<string, NeCity[]>, iso: string, lat: number, lon: number) {
  const max = 0.36 * 0.36;
  let best = "";
  let bestD = max;
  const i0 = Math.round(lat * 2);
  const j0 = Math.round(lon * 2);
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      const arr = grid.get(`${i0 + di}_${j0 + dj}`);
      if (!arr) continue;
      for (const p of arr) {
        if (p.iso !== iso) continue;
        const d = (p.lat - lat) ** 2 + (p.lon - lon) ** 2;
        if (d < bestD) {
          bestD = d;
          best = p.name;
        }
      }
    }
  }
  return best;
}

type Ring = number[][];
type CountryIdx = { iso: string; lat: number; lon: number; minX: number; minY: number; maxX: number; maxY: number; polys: Ring[][] };

let geoCache: { at: number; ver: number; idx: CountryIdx[] } | null = null;
let statsCache: { at: number; ver: number; data: GlobeStats } | null = null;
const STATS_VER = 6;

export function clearGlobeStatsCache() {
  statsCache = null;
  geoCache = null;
}

function isoOf(props: Record<string, unknown>) {
  const a2 = String(props.ISO_A2 || "");
  if (a2 && a2 !== "-99") return a2;
  const eh = String(props.ISO_A2_EH || "");
  if (eh && eh !== "-99") return eh;
  return "";
}

function ringsOf(geom: { type?: string; coordinates?: unknown }): Ring[][] {
  const t = geom.type;
  const c = geom.coordinates;
  if (t === "Polygon" && Array.isArray(c)) return [c as Ring[]];
  if (t === "MultiPolygon" && Array.isArray(c)) return c as Ring[][];
  return [];
}

function centroid(polys: Ring[][]) {
  let x = 0;
  let y = 0;
  let n = 0;
  const ring = polys[0]?.[0] || [];
  for (const p of ring) {
    x += Number(p[0]);
    y += Number(p[1]);
    n++;
  }
  if (!n) return { lat: 0, lon: 0 };
  return { lon: x / n, lat: y / n };
}

function pip(lon: number, lat: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!;
    const yi = ring[i]![1]!;
    const xj = ring[j]![0]!;
    const yj = ring[j]![1]!;
    const hit = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

function inCountry(lon: number, lat: number, c: CountryIdx) {
  if (lon < c.minX || lon > c.maxX || lat < c.minY || lat > c.maxY) return false;
  for (const poly of c.polys) {
    const outer = poly[0];
    if (!outer || !pip(lon, lat, outer)) continue;
    let hole = false;
    for (let i = 1; i < poly.length; i++) if (pip(lon, lat, poly[i]!)) hole = true;
    if (!hole) return true;
  }
  return false;
}

async function countryIndex(): Promise<CountryIdx[]> {
  if (geoCache && geoCache.ver === STATS_VER && Date.now() - geoCache.at < 24 * 60 * 60_000) return geoCache.idx;
  const res = await fetch(GEO_URL, { headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0" } });
  if (!res.ok) throw new Error(`geo ${res.status}`);
  const raw = (await res.json()) as { features?: { properties?: Record<string, unknown>; geometry?: { type?: string; coordinates?: unknown } }[] };
  const idx: CountryIdx[] = [];
  for (const f of raw.features || []) {
    const iso = isoOf(f.properties || {});
    if (!iso) continue;
    const polys = ringsOf(f.geometry || {});
    if (!polys.length) continue;
    let minX = 180;
    let maxX = -180;
    let minY = 90;
    let maxY = -90;
    for (const poly of polys) {
      for (const p of poly[0] || []) {
        minX = Math.min(minX, p[0]!);
        maxX = Math.max(maxX, p[0]!);
        minY = Math.min(minY, p[1]!);
        maxY = Math.max(maxY, p[1]!);
      }
    }
    const c = centroid(polys);
    idx.push({ iso, lat: c.lat, lon: c.lon, minX, minY, maxX, maxY, polys });
  }
  try {
    const { readFile } = await import("node:fs/promises");
    const patch = JSON.parse(await readFile(UY_PATCH, "utf8")) as {
      iso?: string;
      geometry?: { type?: string; coordinates?: unknown };
    };
    const polys = ringsOf(patch.geometry || {});
    if (polys.length) {
      let minX = 180,
        maxX = -180,
        minY = 90,
        maxY = -90;
      for (const poly of polys) {
        for (const p of poly[0] || []) {
          minX = Math.min(minX, p[0]!);
          maxX = Math.max(maxX, p[0]!);
          minY = Math.min(minY, p[1]!);
          maxY = Math.max(maxY, p[1]!);
        }
      }
      const c = centroid(polys);
      const row = { iso: "UY", lat: c.lat, lon: c.lon, minX, minY, maxX, maxY, polys };
      const i = idx.findIndex((x) => x.iso === "UY");
      if (i >= 0) idx[i] = row;
      else idx.push(row);
    }
  } catch {
    /* 110m fallback */
  }
  geoCache = { at: Date.now(), ver: STATS_VER, idx };
  return idx;
}

function locateExact(lon: number, lat: number, idx: CountryIdx[]) {
  for (const c of idx) if (inCountry(lon, lat, c)) return c.iso;
  return "";
}

/** 110m coastlines drop river cities (Colonia, Montevideo). Probe inland. */
function locate(lon: number, lat: number, idx: CountryIdx[]) {
  const hit = locateExact(lon, lat, idx);
  if (hit) return hit;
  const steps = [0.15, 0.35, 0.6, 1];
  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  for (const s of steps) {
    for (const [dx, dy] of dirs) {
      const iso = locateExact(lon + dx * s, lat + dy * s, idx);
      if (iso) return iso;
    }
  }
  return "";
}

export async function fetchGlobeStats(): Promise<GlobeStats> {
  if (statsCache && statsCache.ver === STATS_VER && Date.now() - statsCache.at < 30 * 60_000) return statsCache.data;
  const [idx, shops, comms, ev, csv, places] = await Promise.all([
    countryIndex(),
    fetchAllMerchants(),
    fetchBtcCommunities().catch(() => []),
    fetchNetworkEvents().catch(() => ({ events: [] as { countryCode: string }[] })),
    loadMapCsvText().catch(() => ""),
    loadNeCities(),
  ]);
  const grid = cityGrid(places);
  const byIso = new Map<string, GlobeCountryStat>();
  const cityKeys = new Map<string, Set<string>>();
  const rawPts: { lat: number; lon: number }[] = [];
  const bump = (iso: string, key: "shops" | "comms" | "events") => {
    if (!iso || iso.length !== 2) return;
    const code = iso.toUpperCase();
    let row = byIso.get(code);
    if (!row) {
      const meta = idx.find((c) => c.iso === code);
      row = { iso: code, lat: meta?.lat ?? 0, lon: meta?.lon ?? 0, shops: 0, comms: 0, events: 0, cities: 0 };
      byIso.set(code, row);
    }
    row[key]++;
  };
  const markCity = (iso: string, lat: number, lon: number) => {
    if (!iso || iso.length !== 2 || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const code = iso.toUpperCase();
    const name = nearestCity(grid, code, lat, lon);
    if (!name) return;
    let set = cityKeys.get(code);
    if (!set) {
      set = new Set();
      cityKeys.set(code, set);
    }
    set.add(name);
  };
  for (const p of shops) {
    const iso = locate(p.lon, p.lat, idx);
    bump(iso, "shops");
    markCity(iso, p.lat, p.lon);
    rawPts.push({ lat: p.lat, lon: p.lon });
  }
  for (const c of comms) {
    const iso = locate(c.lon, c.lat, idx);
    bump(iso, "comms");
    markCity(iso, c.lat, c.lon);
    rawPts.push({ lat: c.lat, lon: c.lon });
  }
  const shopIds = new Set(shops.map((p) => p.id));
  const commIds = new Set(comms.flatMap((c) => [c.id, c.slug, `c:${c.slug}`]));
  const overlay: GlobeDot[] = [];
  try {
    const rows = parseMapCsv(csv);
    for (const r of rows) {
      if (!Number.isFinite(r.lat) || !Number.isFinite(r.lon)) continue;
      const isComm = r.tipo === "community";
      const known = isComm ? commIds.has(r.id) || commIds.has(r.id.replace(/^c:/, "")) : shopIds.has(r.id);
      if (known) continue;
      const iso = locate(r.lon, r.lat, idx);
      bump(iso, isComm ? "comms" : "shops");
      markCity(iso, r.lat, r.lon);
      overlay.push({ lat: r.lat, lon: r.lon, n: 10 });
      rawPts.push({ lat: r.lat, lon: r.lon });
    }
  } catch {
    /* overlay optional */
  }
  for (const e of ev.events) {
    if (e.countryCode) bump(e.countryCode, "events");
  }
  const countries = [...byIso.values()];
  for (const row of countries) {
    row.cities = cityKeys.get(row.iso)?.size ?? 0;
  }
  const buckets = new Map<string, GlobeDot>();
  for (const p of rawPts) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
    const lat = Math.round(p.lat * 4) / 4;
    const lon = Math.round(p.lon * 4) / 4;
    const k = `${lat},${lon}`;
    const row = buckets.get(k) || { lat, lon, n: 0 };
    row.n++;
    buckets.set(k, row);
  }
  for (const c of countries) {
    if (c.events > 0 && Number.isFinite(c.lat) && Number.isFinite(c.lon)) {
      const lat = Math.round(c.lat * 4) / 4;
      const lon = Math.round(c.lon * 4) / 4;
      const k = `${lat},${lon}`;
      const row = buckets.get(k) || { lat, lon, n: 0 };
      row.n += c.events;
      buckets.set(k, row);
    }
  }
  const points = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 1800);
  const data: GlobeStats = {
    world: {
      shops: countries.reduce((s, c) => s + c.shops, 0),
      comms: countries.reduce((s, c) => s + c.comms, 0),
      events: countries.reduce((s, c) => s + c.events, 0),
      cities: countries.reduce((s, c) => s + c.cities, 0),
    },
    countries,
    points,
    overlay,
    asOf: Date.now(),
  };
  statsCache = { at: Date.now(), ver: STATS_VER, data };
  return data;
}
