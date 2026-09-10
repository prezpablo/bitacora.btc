import { countryName } from "@/lib/display";
import type { AppLang } from "@/lib/locale";
import {
  addressIssues,
  expandStreetQuery,
  houseFromQuery,
  pinMatchesAddress,
  searchStreetQuery,
  streetKey,
  streetMatchesQuery,
  type AddrIssue,
  type StreetHit,
} from "@/domain/street-addr";

export type { AddrIssue, StreetHit };
export { addressIssues, expandStreetQuery, pinMatchesAddress, streetKey, streetMatchesQuery };

type PhotonFeature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

const PHOTON = "https://photon.komoot.io";
const PHOTON_HEADERS = {
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; bitacora.btc/1.0; +https://bitacorabtc.org)",
};

/** Photon solo indexa de/fr/en. lang=es devolvía lista vacía. */
function photonLang(lang: string) {
  const l = (lang || "en").slice(0, 2).toLowerCase();
  if (l === "de" || l === "fr") return l;
  return "en";
}

export function photonSearchUrl(q: string, lang: string, near?: { lat: number; lon: number } | null) {
  const u = new URL(`${PHOTON}/api/`);
  u.searchParams.set("q", searchStreetQuery(q) || q);
  u.searchParams.set("limit", "8");
  u.searchParams.set("lang", photonLang(lang));
  if (near && Number.isFinite(near.lat) && Number.isFinite(near.lon)) {
    u.searchParams.set("lat", String(near.lat));
    u.searchParams.set("lon", String(near.lon));
    u.searchParams.set("location_bias_scale", "0.12");
  }
  return u.toString();
}

const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

export function photonReverseUrl(lat: number, lon: number, lang: string) {
  const u = new URL(`${PHOTON}/reverse`);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lon", String(lon));
  u.searchParams.set("lang", photonLang(lang));
  return u.toString();
}

function houseFrom(label: string, given?: string) {
  if (given && /\d/.test(given)) return given.trim();
  const m = label.match(/(?:^|\s)(\d+[A-Za-z]?)(?:\s|$|,)/);
  return m?.[1];
}

function lineOf(p: PhotonFeature["properties"]) {
  if (!p) return { label: "", hint: "", street: "", number: "", city: "", country: "", countryCode: "" };
  const street = p.street || p.name || "";
  const number = houseFrom([p.housenumber, p.street, p.name].filter(Boolean).join(" "), p.housenumber);
  const label = [number, street].filter(Boolean).join(" ") || p.name || p.city || p.town || "";
  const city = p.city || p.town || p.village || "";
  const country = p.country || "";
  const countryCode = (p.countrycode || "").toUpperCase();
  const hint = [city, p.state, country].filter(Boolean).join(", ");
  return { label, hint, street, number: number || "", city, country, countryCode };
}

function hitFromFeature(f: PhotonFeature, pin?: { lat: number; lon: number; fromMap?: boolean }): StreetHit | null {
  const lon = pin?.lon ?? f.geometry?.coordinates?.[0];
  const lat = pin?.lat ?? f.geometry?.coordinates?.[1];
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  const parts = lineOf(f.properties);
  if (!parts.label) return null;
  const id = pin?.fromMap ? `map:${lat.toFixed(5)},${lon.toFixed(5)}` : `${f.properties?.osm_id ?? `${lat},${lon}`}`;
  return {
    id,
    lat,
    lon,
    label: parts.label,
    hint: parts.hint,
    street: parts.street || undefined,
    number: parts.number || undefined,
    city: parts.city || undefined,
    country: parts.country || undefined,
    countryCode: parts.countryCode || undefined,
    fromMap: pin?.fromMap,
  };
}

export function formatStreet(hit: StreetHit, lang?: AppLang) {
  const country =
    lang && hit.countryCode ? countryName(hit.countryCode, lang, hit.country || "") : hit.country || "";
  const hint = [hit.city, country].filter(Boolean).join(", ");
  return hint ? `${hit.label}, ${hint}` : hit.label;
}

export async function searchStreets(
  q: string,
  lang: string,
  near?: { lat: number; lon: number } | null,
): Promise<StreetHit[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const needle = searchStreetQuery(query);
  const res = await fetch(photonSearchUrl(needle || query, lang, near), { headers: PHOTON_HEADERS });
  if (!res.ok) throw new Error(String(res.status));
  const j = (await res.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  const rows: StreetHit[] = [];
  const num = houseFromQuery(query);
  for (const f of j.features || []) {
    let hit = hitFromFeature(f);
    if (!hit) continue;
    // Photon suele devolver la calle sin altura; si el usuario escribió "200", se lo pegamos.
    if (num && !hit.number) {
      hit = { ...hit, number: num, label: `${num} ${hit.street || hit.label}` };
    }
    const k = streetKey(hit.street || hit.label);
    if (seen.has(hit.id) || (k && seen.has(k))) continue;
    seen.add(hit.id);
    if (k) seen.add(k);
    rows.push(hit);
  }
  return rows;
}

export async function reverseStreet(lat: number, lon: number, lang: string): Promise<StreetHit | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const res = await fetch(photonReverseUrl(lat, lon, lang), { headers: PHOTON_HEADERS });
  if (!res.ok) return null;
  const j = (await res.json()) as { features?: PhotonFeature[] };
  const f = j.features?.[0];
  if (!f) return null;
  const hit = hitFromFeature(f);
  if (!hit) return null;
  // fromMap: el caller debe conservar las coords del pin (Photon da el centro de la calle).
  return { ...hit, fromMap: true };
}

type OsmWay = {
  id?: number;
  tags?: { name?: string };
  center?: { lat?: number; lon?: number };
};

async function overpassBlockWays(lat: number, lon: number): Promise<OsmWay[]> {
  const q = `[out:json][timeout:8];way(around:90,${lat},${lon})["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|trunk)$"]["name"];out tags center 16;`;
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "bitacora.btc/1.0",
        },
        body: new URLSearchParams({ data: q }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;
      const j = (await res.json()) as { elements?: OsmWay[] };
      return j.elements || [];
    } catch {
      continue;
    }
  }
  return [];
}

function offsetMeters(lat: number, ns: number, ew: number) {
  const dLat = ns / 111_320;
  const dLon = ew / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return { dLat, dLon };
}

/** Calles de la manzana (N/S/E/O ~80 m). fromMap=true: el pin no se mueve al elegirlas. */
export async function nearbyStreets(lat: number, lon: number, lang: string): Promise<StreetHit[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
  const ctx = await reverseStreet(lat, lon, lang);
  const city = ctx?.city;
  const country = ctx?.country;
  const countryCode = ctx?.countryCode;
  const rows: StreetHit[] = [];
  const seen = new Set<string>();
  const push = (hit: StreetHit | null) => {
    if (!hit) return;
    const k = streetKey(hit.street || hit.label);
    if (!k || seen.has(k)) return;
    seen.add(k);
    rows.push({
      ...hit,
      lat,
      lon, // coords del pin, no del eje de la calle
      city: hit.city || city,
      country: hit.country || country,
      countryCode: hit.countryCode || countryCode,
      fromMap: true,
      hint: [hit.city || city, hit.country || country].filter(Boolean).join(", "),
    });
  };
  if (ctx) push({ ...ctx, street: ctx.street || ctx.label, label: ctx.street || ctx.label });

  const { dLat, dLon } = offsetMeters(lat, 80, 80);
  const pts: [number, number][] = [
    [lat + dLat, lon],
    [lat - dLat, lon],
    [lat, lon + dLon],
    [lat, lon - dLon],
  ];
  const around = await Promise.all(pts.map(([a, b]) => reverseStreet(a, b, lang).catch(() => null)));
  for (const h of around) {
    if (rows.length >= 4) break;
    push(h);
  }

  if (rows.length === 0) {
    const ways = await overpassBlockWays(lat, lon);
    const ranked = ways
      .map((el) => {
        const name = (el.tags?.name || "").trim();
        const clat = el.center?.lat ?? lat;
        const clon = el.center?.lon ?? lon;
        const d = (clat - lat) ** 2 + (clon - lon) ** 2;
        return { name, d, id: el.id || 0 };
      })
      .filter((x) => x.name)
      .sort((a, b) => a.d - b.d);
    for (const r of ranked) {
      if (rows.length >= 4) break;
      push({
        id: `near:${r.id}`,
        label: r.name,
        hint: [city, country].filter(Boolean).join(", "),
        lat,
        lon,
        street: r.name,
        city,
        country,
        countryCode,
        fromMap: true,
      });
    }
  }
  return rows.slice(0, 4);
}
