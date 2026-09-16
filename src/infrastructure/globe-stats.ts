import type { GlobeCountryStat, GlobeDot, GlobeStats } from "@/domain/globe";
import { FOUNDING_UY, LATAM_ISO, tallyCountries, tallyEvents } from "@/domain/globe";
import { isoFromCountryName } from "@/domain";
import { fetchAllMerchants, fetchBtcCommunities } from "./btc-map";
import { fetchNetworkEvents } from "./events";
import { logoUrl, parseMapCsv } from "@/domain/map-csv";
import { dedupeCommunities } from "@/domain/community-dedupe";
import { loadMapCsvText } from "./map-csv-io";
import { readFirstFile } from "./data-files";

const GEO_FILE = "public/data/ne-110m-countries.json";
const GEO_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson";
const UY_PATCH = "public/data/ne-uy-10m.json";
const CITIES_FILE = "public/data/ne-cities-10m.json";

type NeCity = { iso: string; name: string; lat: number; lon: number };

let cityList: NeCity[] | null = null;

async function loadNeCities(): Promise<NeCity[]> {
  if (cityList) return cityList;
  try {
    const text = await readFirstFile(CITIES_FILE);
    cityList = text ? (JSON.parse(text) as NeCity[]) : [];
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
const STATS_VER = 26;

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
  let raw: { features?: { properties?: Record<string, unknown>; geometry?: { type?: string; coordinates?: unknown } }[] } = { features: [] };
  try {
    const text = await readFirstFile(GEO_FILE);
    if (text) raw = JSON.parse(text) as typeof raw;
    else throw new Error("no local geo");
  } catch {
    const res = await fetch(GEO_URL, { headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0" } });
    if (!res.ok) throw new Error(`geo ${res.status}`);
    raw = (await res.json()) as typeof raw;
  }
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
    const patchText = await readFirstFile(UY_PATCH);
    const patch = JSON.parse(patchText) as {
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

function locateOrNearest(lon: number, lat: number, idx: CountryIdx[]) {
  const hit = locate(lon, lat, idx);
  if (hit) return hit;
  let best = "";
  let bestD = 36;
  for (const c of idx) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c.iso;
    }
  }
  return best;
}

export async function fetchGlobeStats(): Promise<GlobeStats> {
  if (statsCache && statsCache.ver === STATS_VER && Date.now() - statsCache.at < 2 * 60_000) return statsCache.data;
  const empty = { events: [] as { countryCode: string; country?: string }[] };
  const [idx, shops, comms, ev, csv, places] = await Promise.all([
    countryIndex().catch(() => [] as CountryIdx[]),
    fetchAllMerchants().catch(() => []),
    fetchBtcCommunities().catch(() => []),
    fetchNetworkEvents().catch(() => empty),
    (async () => {
      try {
        const t = await loadMapCsvText();
        if (t.includes("id,tipo")) return t;
      } catch {
        /* sqlite optional */
      }
      try {
        return await readFirstFile("public/data/map.csv");
      } catch {
        return "";
      }
    })(),
    loadNeCities().catch(() => [] as NeCity[]),
  ]);
  const grid = cityGrid(places);
  const byIso = new Map<string, GlobeCountryStat>();
  const cityKeys = new Map<string, Set<string>>();
  const listings = new Map<string, GlobeDot>();
  const addListing = (pin: GlobeDot) => {
    if (!pin.id || !Number.isFinite(pin.lat) || !Number.isFinite(pin.lon)) return false;
    if (listings.has(pin.id)) return false;
    listings.set(pin.id, { id: pin.id, lat: pin.lat, lon: pin.lon, n: pin.n || 1, kind: pin.kind, name: pin.name, logo: pin.logo });
    return true;
  };
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
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
    bump(locate(p.lon, p.lat, idx), "shops");
    markCity(locate(p.lon, p.lat, idx), p.lat, p.lon);
  }
  for (const c of comms) {
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;
    const iso = locate(c.lon, c.lat, idx);
    bump(iso, "comms");
    markCity(iso, c.lat, c.lon);
    addListing({
      id: c.id || c.slug,
      lat: c.lat,
      lon: c.lon,
      n: 1,
      name: c.name,
      kind: "community",
      logo: logoUrl(c.logo || "") || undefined,
    });
  }
  const overlay: GlobeDot[] = [];
  try {
    for (const r of parseMapCsv(csv)) {
      if (!Number.isFinite(r.lat) || !Number.isFinite(r.lon)) continue;
      const isComm = r.tipo === "community";
      const iso = locateOrNearest(r.lon, r.lat, idx);
      bump(iso, isComm ? "comms" : "shops");
      markCity(iso, r.lat, r.lon);
      const pin: GlobeDot = {
        id: r.id,
        lat: r.lat,
        lon: r.lon,
        n: isComm ? 2 : 1,
        name: r.name,
        kind: isComm ? "community" : "shop",
        logo: logoUrl(r.logo || "") || undefined,
      };
      const prev = listings.get(r.id);
      if (prev) {
        if (pin.logo && !prev.logo) prev.logo = pin.logo;
        if (pin.name && !prev.name) prev.name = pin.name;
        overlay.push(prev);
      } else {
        addListing(pin);
        overlay.push(pin);
      }
    }
  } catch {
    /* csv optional */
  }
  const founding: GlobeDot = {
    id: FOUNDING_UY.id,
    lat: FOUNDING_UY.lat,
    lon: FOUNDING_UY.lon,
    n: 3,
    name: FOUNDING_UY.name,
    kind: "community",
    logo: FOUNDING_UY.logo,
  };
  addListing(founding);
  listings.set(FOUNDING_UY.id, founding);
  if (!overlay.some((o) => o.id === founding.id)) overlay.push(founding);
  else {
    const i = overlay.findIndex((o) => o.id === founding.id);
    if (i >= 0) overlay[i] = founding;
  }
  bump("UY", "comms");
  markCity("UY", founding.lat, founding.lon);
  for (const e of ev.events) {
    const iso = ((e.countryCode || isoFromCountryName(e.country || "") || "").toUpperCase());
    if (iso.length === 2) bump(iso, "events");
  }
  const countries = [...byIso.values()];
  for (const row of countries) {
    row.cities = cityKeys.get(row.iso)?.size ?? 0;
  }
  const points = dedupeCommunities(
    [...listings.values()]
      .filter((p) => p.kind === "community" && p.id)
      .map((p) => ({ ...p, id: p.id as string, name: p.name || (p.id as string) })),
  );
  const evN = tallyEvents(ev.events);
  const world = tallyCountries(countries);
  const latam = tallyCountries(countries, LATAM_ISO);
  world.events = evN.world;
  latam.events = evN.latam;
  const data: GlobeStats = {
    world,
    latam,
    countries,
    points,
    overlay,
    asOf: Date.now(),
  };
  statsCache = { at: Date.now(), ver: STATS_VER, data };
  return data;
}
