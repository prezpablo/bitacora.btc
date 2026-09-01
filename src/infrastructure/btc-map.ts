import { mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Community, MerchantPlace } from "@/domain";
import { logoUrl } from "@/domain/map-csv";
import { keyFromUrl, type SocialKey, type SocialLink } from "@/domain/socials";

type RawEl = {
  id: string;
  created_at?: string;
  deleted_at?: string | null;
  osm_json?: {
    lat?: number;
    lon?: number;
    center?: { lat?: number; lon?: number };
    tags?: Record<string, string>;
  };
  tags?: { category?: string };
};

const TTL = 6 * 60_000 * 60;
const SHOP_SNAP = join(process.cwd(), "data", "btcmap-shops.json");
let cache: { at: number; places: MerchantPlace[] } | null = null;
let inflight: Promise<MerchantPlace[]> | null = null;
let commCache: { at: number; rows: Community[] } | null = null;
let commInflight: Promise<Community[]> | null = null;

function asPlace(el: RawEl): MerchantPlace | null {
  if (el.deleted_at) return null;
  const o = el.osm_json;
  if (!o) return null;
  const lat = o.lat ?? o.center?.lat;
  const lon = o.lon ?? o.center?.lon;
  if (lat == null || lon == null) return null;
  const name = o.tags?.name || o.tags?.brand || "Comercio Bitcoin";
  return {
    id: el.id,
    lat,
    lon,
    name,
    category: el.tags?.category || o.tags?.amenity || o.tags?.shop || o.tags?.tourism || "lugar",
    createdAt: el.created_at ? Date.parse(el.created_at) : Date.now(),
  };
}

function fileAgeMs(path: string) {
  try {
    return Date.now() - statSync(path).mtimeMs;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function readSnap(): MerchantPlace[] {
  try {
    const rows = JSON.parse(readFileSync(SHOP_SNAP, "utf8")) as MerchantPlace[];
    return Array.isArray(rows) ? rows.filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.id) : [];
  } catch {
    return [];
  }
}

function writeSnap(places: MerchantPlace[]) {
  try {
    mkdirSync(dirname(SHOP_SNAP), { recursive: true });
    writeFileSync(SHOP_SNAP, JSON.stringify(places));
  } catch {
    /* disk optional */
  }
}

async function loadAll(): Promise<MerchantPlace[]> {
  const now = Date.now();
  if (cache && now - cache.at < TTL && cache.places.length) return cache.places;
  if (inflight) return inflight;
  inflight = (async () => {
    const snap = readSnap();
    if (snap.length >= 50 && fileAgeMs(SHOP_SNAP) < TTL) {
      cache = { at: Date.now(), places: snap };
      return snap;
    }
    try {
      const res = await fetch("https://api.btcmap.org/v2/elements", {
        headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0" },
        signal: AbortSignal.timeout(55_000),
      });
      if (!res.ok) throw new Error(`btcmap ${res.status}`);
      const raw = (await res.json()) as RawEl[];
      const places: MerchantPlace[] = [];
      for (const el of raw) {
        const p = asPlace(el);
        if (p) places.push(p);
      }
      const out = places.length >= 50 ? places : snap.length ? snap : FALLBACK;
      if (out.length >= 50) writeSnap(out);
      cache = { at: Date.now(), places: out };
      return out;
    } catch {
      const out = snap.length ? snap : FALLBACK;
      cache = { at: Date.now(), places: out };
      return out;
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

const FALLBACK: MerchantPlace[] = [
  { id: "node:10056846692", lat: -34.92496, lon: -56.15906, name: "Moshi Moshi", category: "restaurant", createdAt: Date.now() - 400 * 86_400_000 },
  { id: "node:2582212708", lat: -34.90985, lon: -56.19498, name: "Willy Fogg", category: "cafe", createdAt: Date.now() - 800 * 86_400_000 },
  { id: "node:5550143466", lat: -34.90113, lon: -56.19132, name: "PRO Accesorios", category: "shop", createdAt: Date.now() - 500 * 86_400_000 },
  { id: "node:2640796932", lat: -34.90734, lon: -56.20159, name: "Splendido Hotel", category: "hotel", createdAt: Date.now() - 900 * 86_400_000 },
  { id: "node:5122775107", lat: -34.90137, lon: -56.14643, name: "MBC Montevideo Boulder Club", category: "sport", createdAt: Date.now() - 200 * 86_400_000 },
  { id: "node:13424595224", lat: -34.89667, lon: -56.16615, name: "Roderichs Crypto House", category: "shop", createdAt: Date.now() - 120 * 86_400_000 },
];

export async function fetchAllMerchants(): Promise<MerchantPlace[]> {
  try {
    const rows = await loadAll();
    return rows.length ? rows : FALLBACK;
  } catch {
    const snap = readSnap();
    return snap.length ? snap : FALLBACK;
  }
}

function inBox(
  p: { lat: number; lon: number },
  b: { west: number; south: number; east: number; north: number },
) {
  return p.lon >= b.west && p.lon <= b.east && p.lat >= b.south && p.lat <= b.north;
}

async function overpassBbox(b: { west: number; south: number; east: number; north: number }): Promise<MerchantPlace[]> {
  const span = Math.abs(b.east - b.west) * Math.abs(b.north - b.south);
  if (span > 80) return [];
  const q = `[out:json][timeout:20];(nwr["payment:bitcoin"="yes"](${b.south},${b.west},${b.north},${b.east});nwr["currency:XBT"="yes"](${b.south},${b.west},${b.north},${b.east}););out center tags;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "bitacora.btc/1.0",
    },
    body: new URLSearchParams({ data: q }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    elements?: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[];
  };
  const out: MerchantPlace[] = [];
  for (const el of json.elements || []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const tags = el.tags || {};
    out.push({
      id: `osm:${el.type}:${el.id}`,
      lat: lat as number,
      lon: lon as number,
      name: tags.name || tags.brand || "Comercio Bitcoin",
      category: tags.amenity || tags.shop || tags.tourism || "lugar",
      createdAt: Date.now(),
    });
  }
  return out;
}

export async function fetchMerchants(bbox: {
  west: number;
  south: number;
  east: number;
  north: number;
}): Promise<MerchantPlace[]> {
  const map = new Map<string, MerchantPlace>();
  try {
    const all = await loadAll();
    for (const p of all) if (inBox(p, bbox)) map.set(p.id, p);
  } catch {
    /* dump optional */
  }
  if (map.size < 12) {
    try {
      for (const p of await overpassBbox(bbox)) map.set(p.id, p);
    } catch {
      /* overpass optional */
    }
  }
  if (!map.size) {
    for (const p of FALLBACK) if (inBox(p, bbox)) map.set(p.id, p);
  }
  return [...map.values()].slice(0, 500);
}

export async function searchMerchants(q: string): Promise<MerchantPlace[]> {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  try {
    const all = await loadAll();
    const hits: MerchantPlace[] = [];
    for (const p of all) {
      if (p.name.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle)) {
        hits.push(p);
        if (hits.length >= 8) break;
      }
    }
    return hits.length ? hits : FALLBACK.filter((p) => p.name.toLowerCase().includes(needle));
  } catch {
    return FALLBACK.filter((p) => p.name.toLowerCase().includes(needle));
  }
}

export async function searchCities(q: string): Promise<{ label: string; lat: number; lon: number }[]> {
  const needle = q.trim();
  if (needle.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=0&q=${encodeURIComponent(needle)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0 (mapa Bitcoin)" },
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as { display_name?: string; lat?: string; lon?: string }[];
  return rows
    .map((r) => ({
      label: r.display_name || needle,
      lat: Number(r.lat),
      lon: Number(r.lon),
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));
}

type RawArea = {
  id: string;
  created_at?: string;
  deleted_at?: string | null;
  tags?: Record<string, unknown>;
};

function ringCentroid(ring: number[][]): { lat: number; lon: number } | null {
  if (!ring?.length) return null;
  let x = 0;
  let y = 0;
  let n = 0;
  for (const p of ring) {
    if (!Array.isArray(p) || p.length < 2) continue;
    x += Number(p[0]);
    y += Number(p[1]);
    n++;
  }
  if (!n) return null;
  return { lon: x / n, lat: y / n };
}

function geoCentroid(geo: unknown): { lat: number; lon: number } | null {
  let g: unknown = geo;
  if (typeof g === "string") {
    try {
      g = JSON.parse(g);
    } catch {
      return null;
    }
  }
  if (!g || typeof g !== "object") return null;
  const obj = g as { type?: string; coordinates?: unknown; geometry?: unknown; features?: unknown[] };
  if (obj.geometry) return geoCentroid(obj.geometry);
  if (obj.type === "FeatureCollection" && Array.isArray(obj.features) && obj.features[0]) return geoCentroid(obj.features[0]);
  if (obj.type === "Polygon") {
    const ring = (obj.coordinates as number[][][] | undefined)?.[0];
    return ring ? ringCentroid(ring) : null;
  }
  if (obj.type === "MultiPolygon") {
    const ring = (obj.coordinates as number[][][][] | undefined)?.[0]?.[0];
    return ring ? ringCentroid(ring) : null;
  }
  if (obj.type === "Point") {
    const p = obj.coordinates as number[] | undefined;
    if (p && p.length >= 2) return { lon: Number(p[0]), lat: Number(p[1]) };
  }
  if (obj.type === "GeometryCollection" && Array.isArray((obj as { geometries?: unknown[] }).geometries)) {
    for (const part of (obj as { geometries: unknown[] }).geometries) {
      const c = geoCentroid(part);
      if (c) return c;
    }
  }
  return null;
}

function areaCenter(tags: Record<string, unknown>): { lat: number; lon: number } | null {
  const g = tags.geo_json as { lat?: number; lon?: number } | unknown;
  if (g && typeof g === "object" && Number.isFinite((g as { lat?: number }).lat) && Number.isFinite((g as { lon?: number }).lon)) {
    return { lat: Number((g as { lat: number }).lat), lon: Number((g as { lon: number }).lon) };
  }
  const fromGeo = geoCentroid(tags.geo_json);
  if (fromGeo) return fromGeo;
  const lat = Number(tags.lat ?? tags["geo:lat"]);
  const lon = Number(tags.lon ?? tags.lng ?? tags["geo:lon"]);
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  const n = Number(tags["box:north"]);
  const s = Number(tags["box:south"]);
  const e = Number(tags["box:east"]);
  const w = Number(tags["box:west"]);
  if ([n, s, e, w].every(Number.isFinite)) return { lat: (n + s) / 2, lon: (e + w) / 2 };
  return null;
}

function areaLinks(tags: Record<string, unknown>): SocialLink[] {
  const rows: SocialLink[] = [];
  const seen = new Set<string>();
  for (const [k, raw] of Object.entries(tags)) {
    if (!k.startsWith("contact:") || typeof raw !== "string" || !raw.trim()) continue;
    const url = raw.trim();
    if (!/^https?:\/\//i.test(url) && !url.includes(".")) continue;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const key: SocialKey = k === "contact:twitter" ? "x" : k === "contact:website" ? "web" : keyFromUrl(href);
    const id = `${key}:${href}`;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({ key, label: key, url: href });
  }
  return rows;
}

function pickAreaIcon(tags: Record<string, unknown>) {
  for (const k of ["icon:square", "icon", "icon:background", "image", "logo"]) {
    const v = tags[k];
    if (typeof v !== "string" || !v.trim()) continue;
    const u = logoUrl(v);
    if (u) return u;
  }
  return "";
}

function asCommunity(el: RawArea): Community | null {
  const deleted = String(el.deleted_at || "");
  if (/^\d{4}-\d{2}/.test(deleted)) return null;
  const tags = (el.tags || {}) as Record<string, unknown>;
  const type = String(tags.type || "").toLowerCase();
  const rootType = String((el as { type?: string }).type || "").toLowerCase();
  const kind = type || rootType;
  if (kind === "country" || kind === "continent" || kind === "world" || kind === "planet" || kind === "trash") return null;
  if (kind && kind !== "community" && kind !== "meetup" && kind !== "region") return null;
  const center = areaCenter(tags);
  if (!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lon)) return null;
  const name = String(tags.name || tags["name:es"] || tags["name:en"] || el.id);
  const icon = pickAreaIcon(tags);
  const continent = typeof tags.continent === "string" ? tags.continent : "";
  return {
    id: `btcmap:${el.id}`,
    slug: String(tags.url_alias || el.id),
    name,
    lat: center.lat,
    lon: center.lon,
    logo: icon,
    description: continent ? `BTC Map · ${continent}` : "BTC Map",
    links: areaLinks(tags),
    createdAt: el.created_at ? Date.parse(el.created_at) : Date.now(),
  };
}

const COMM_SNAP = join(process.cwd(), "data", "btcmap-comms.json");

function readCommSnap(): Community[] {
  try {
    const rows = JSON.parse(readFileSync(COMM_SNAP, "utf8")) as Community[];
    return Array.isArray(rows) ? rows.filter((c) => c && Number.isFinite(c.lat) && Number.isFinite(c.lon) && c.id) : [];
  } catch {
    return [];
  }
}

function writeCommSnap(rows: Community[]) {
  try {
    mkdirSync(dirname(COMM_SNAP), { recursive: true });
    writeFileSync(COMM_SNAP, JSON.stringify(rows));
  } catch {
    /* disk optional */
  }
}

/** Live BTC Map communities — federated, not copied into the CSV overlay. */
export async function fetchBtcCommunities(): Promise<Community[]> {
  const now = Date.now();
  if (commCache && now - commCache.at < TTL && commCache.rows.length) return commCache.rows;
  if (commInflight) return commInflight;
  commInflight = (async () => {
    const snap = readCommSnap();
    if (snap.length && fileAgeMs(COMM_SNAP) < TTL) {
      commCache = { at: Date.now(), rows: snap };
      return snap;
    }
    try {
      const res = await fetch("https://api.btcmap.org/v2/areas", {
        headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0" },
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) throw new Error(`btcmap areas ${res.status}`);
      const text = await res.text();
      const raw = JSON.parse(text, (k, v) => {
        if (k === "geo_json") {
          const c = geoCentroid(v);
          return c || v;
        }
        return v;
      }) as RawArea[];
      const rows: Community[] = [];
      const seen = new Set<string>();
      for (const el of raw) {
        const c = asCommunity(el);
        if (!c || seen.has(c.id)) continue;
        seen.add(c.id);
        rows.push(c);
      }
      for (const slug of ["punta-bitcoin", "bitcoin-school-argentina"]) {
        if ([...seen].some((id) => id.endsWith(`:${slug}`) || id === `btcmap:${slug}`)) continue;
        if (rows.some((c) => c.slug === slug)) continue;
        try {
          const one = await fetch(`https://api.btcmap.org/v2/areas/${slug}`, {
            headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0" },
            signal: AbortSignal.timeout(15_000),
          });
          if (!one.ok) continue;
          const el = (await one.json()) as RawArea;
          const c = asCommunity(el);
          if (c && !seen.has(c.id)) {
            seen.add(c.id);
            rows.push(c);
          }
        } catch {
          /* one area optional */
        }
      }
      const out = rows.length ? rows : snap;
      if (rows.length) writeCommSnap(rows);
      commCache = { at: Date.now(), rows: out };
      return out;
    } catch {
      commCache = { at: Date.now(), rows: snap };
      return snap;
    }
  })().finally(() => {
    commInflight = null;
  });
  return commInflight;
}
