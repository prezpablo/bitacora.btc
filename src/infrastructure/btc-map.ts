import type { Community, MerchantPlace } from "@/domain";
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

async function loadAll(): Promise<MerchantPlace[]> {
  const now = Date.now();
  if (cache && now - cache.at < TTL) return cache.places;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch("https://api.btcmap.org/v2/elements", {
      headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0" },
    });
    if (!res.ok) throw new Error(`btcmap ${res.status}`);
    const raw = (await res.json()) as RawEl[];
    const places: MerchantPlace[] = [];
    for (const el of raw) {
      const p = asPlace(el);
      if (p) places.push(p);
    }
    cache = { at: Date.now(), places };
    return places;
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
    return await loadAll();
  } catch {
    return FALLBACK;
  }
}

export async function fetchMerchants(bbox: {
  west: number;
  south: number;
  east: number;
  north: number;
}): Promise<MerchantPlace[]> {
  try {
    const all = await loadAll();
    const { west, south, east, north } = bbox;
    const hits = all.filter((p) => p.lon >= west && p.lon <= east && p.lat >= south && p.lat <= north);
    if (hits.length > 450) return hits.slice(0, 450);
    return hits.length ? hits : FALLBACK.filter((p) => p.lon >= west && p.lon <= east && p.lat >= south && p.lat <= north);
  } catch {
    return FALLBACK.filter((p) => p.lon >= bbox.west && p.lon <= bbox.east && p.lat >= bbox.south && p.lat <= bbox.north);
  }
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
  if (!geo || typeof geo !== "object") return null;
  const g = geo as { type?: string; coordinates?: unknown };
  if (g.type === "Polygon") {
    const ring = (g.coordinates as number[][][] | undefined)?.[0];
    return ring ? ringCentroid(ring) : null;
  }
  if (g.type === "MultiPolygon") {
    const ring = (g.coordinates as number[][][][] | undefined)?.[0]?.[0];
    return ring ? ringCentroid(ring) : null;
  }
  if (g.type === "Point") {
    const p = g.coordinates as number[] | undefined;
    if (p && p.length >= 2) return { lon: Number(p[0]), lat: Number(p[1]) };
  }
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

function asCommunity(el: RawArea): Community | null {
  if (el.deleted_at) return null;
  const tags = (el.tags || {}) as Record<string, unknown>;
  if (tags.type !== "community") return null;
  const center = geoCentroid(tags.geo_json);
  if (!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lon)) return null;
  const name = String(tags.name || el.id);
  const icon = typeof tags["icon:square"] === "string" ? tags["icon:square"] : "";
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

/** Live BTC Map communities — federated, not copied into the CSV overlay. */
export async function fetchBtcCommunities(): Promise<Community[]> {
  const now = Date.now();
  if (commCache && now - commCache.at < TTL) return commCache.rows;
  if (commInflight) return commInflight;
  commInflight = (async () => {
    const res = await fetch("https://api.btcmap.org/v2/areas", {
      headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0" },
    });
    if (!res.ok) throw new Error(`btcmap areas ${res.status}`);
    const raw = (await res.json()) as RawArea[];
    const rows: Community[] = [];
    for (const el of raw) {
      const c = asCommunity(el);
      if (c) rows.push(c);
    }
    commCache = { at: Date.now(), rows };
    return rows;
  })().finally(() => {
    commInflight = null;
  });
  return commInflight;
}
