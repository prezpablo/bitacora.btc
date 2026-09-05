import { countryName } from "@/lib/display";
import type { AppLang } from "@/lib/locale";
import { addressIssues, type AddrIssue, type StreetHit } from "@/domain/street-addr";

export type { AddrIssue, StreetHit };
export { addressIssues };

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

export function formatStreet(hit: StreetHit, lang?: AppLang) {
  const country =
    lang && hit.countryCode ? countryName(hit.countryCode, lang, hit.country || "") : hit.country || "";
  const hint = [hit.city, country].filter(Boolean).join(", ");
  return hint ? `${hit.label}, ${hint}` : hit.label;
}

export async function searchStreets(q: string, lang: string): Promise<StreetHit[]> {
  const query = q.trim();
  if (query.length < 3) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=7&lang=${lang === "pt" ? "en" : lang}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "bitacora.btc/1.0 (https://bitacora.btc)" },
  });
  if (!res.ok) throw new Error(String(res.status));
  const j = (await res.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  const rows: StreetHit[] = [];
  for (const f of j.features || []) {
    const lon = f.geometry?.coordinates?.[0];
    const lat = f.geometry?.coordinates?.[1];
    if (typeof lat !== "number" || typeof lon !== "number") continue;
    const parts = lineOf(f.properties);
    if (!parts.label) continue;
    const id = `${f.properties?.osm_id ?? `${lat},${lon}`}`;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
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
    });
  }
  return rows;
}
