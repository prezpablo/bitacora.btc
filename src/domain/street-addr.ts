export type StreetHit = {
  id: string;
  label: string;
  hint: string;
  lat: number;
  lon: number;
  street?: string;
  number?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  /** Reverse del tap: el pin ES la puerta. Falta de número no bloquea. */
  fromMap?: boolean;
};

export type AddrIssue = "pick" | "street" | "number" | "city" | "country" | "coords";

/** Photon no habla abreviaciones rioplatenses: "gral flores" → "general flores". */
export function expandStreetQuery(q: string) {
  let s = q.trim();
  const rules: [RegExp, string][] = [
    [/\bgral\b\.?/gi, "general"],
    [/\bavda\b\.?/gi, "avenida"],
    [/\bav\b\.?/gi, "avenida"],
    [/\bcno\b\.?/gi, "camino"],
    [/\bbv(?:ar|r)?\b\.?/gi, "bulevar"],
    [/\bpte\b\.?/gi, "presidente"],
    [/\bcnel\b\.?/gi, "coronel"],
    [/\bdr\b\.?/gi, "doctor"],
    [/\bing\b\.?/gi, "ingeniero"],
    [/\bsta\b\.?/gi, "santa"],
    [/\bsto\b\.?/gi, "santo"],
    [/\bprof\b\.?/gi, "profesor"],
  ];
  for (const [re, to] of rules) s = s.replace(re, to);
  return s.replace(/\s+/g, " ").trim();
}

/** Palabras de lugar que, pegadas en el input, tapan la calle en Photon. */
const PLACE_WORDS = new Set([
  "uruguay",
  "brasil",
  "brazil",
  "argentina",
  "paraguay",
  "chile",
  "colonia",
  "sacramento",
  "paysandu",
  "montevideo",
  "departamento",
  "department",
  "ciudad",
  "city",
  "barrio",
  "uy",
]);

/**
 * Photon/OSM quieren la calle, no "calle, ciudad, depto, país".
 * "18 de Julio 200, colonia del sacramento, uruguay" → "18 de Julio 200".
 */
export function searchStreetQuery(q: string) {
  const raw = expandStreetQuery(q);
  const head = (raw.split(",")[0] || raw).trim();
  const words = head.split(/\s+/).filter((w) => !PLACE_WORDS.has(streetKey(w)));
  return words.join(" ").trim() || head;
}

export function houseFromQuery(q: string) {
  const head = (q.split(",")[0] || q).trim();
  const m = head.match(/\b(\d+[A-Za-z]?)\b/);
  return m?.[1] || "";
}

/** Clave comparable: minúsculas, sin tildes, sin "de/del/la". Sirve para filtrar la manzana. */
export function streetKey(s: string) {
  return expandStreetQuery(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(de|del|la|el|los|las|y|and|do|da)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function streetTokens(q: string) {
  return streetKey(searchStreetQuery(q))
    .split(" ")
    .filter((w) => w.length > 1 && !/^\d+$/.test(w) && !PLACE_WORDS.has(w));
}

/** ¿Esta calle de la manzana encaja con lo que el usuario escribió? */
export function streetMatchesQuery(hit: { street?: string; label: string }, q: string) {
  const tokens = streetTokens(q);
  if (!tokens.length) return true;
  const ht = streetKey(hit.street || hit.label);
  if (!ht) return false;
  if (ht.includes(tokens.join(" ")) || tokens.join(" ").includes(ht)) return true;
  return tokens.every((w) => ht.includes(w)) || tokens.some((w) => w.length > 3 && ht.includes(w));
}

/** Pin y dirección geocodificada tienen que ser la misma puerta (~40 m). */
export const PIN_ADDR_MAX_M = 40;

function metersBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

export function pinMatchesAddress(
  pin: { lat: number; lon: number } | null | undefined,
  hit: { lat: number; lon: number } | null | undefined,
  maxM = PIN_ADDR_MAX_M,
) {
  if (!pin || !hit) return false;
  if (![pin.lat, pin.lon, hit.lat, hit.lon].every(Number.isFinite)) return false;
  return metersBetween(pin, hit) <= maxM;
}

export function addressIssues(hit: StreetHit | null): AddrIssue[] {
  if (!hit) return ["pick"];
  const miss: AddrIssue[] = [];
  if (!Number.isFinite(hit.lat) || !Number.isFinite(hit.lon)) miss.push("coords");
  if (!hit.street && !hit.label) miss.push("street");
  // Tap en el mapa: el pin ya es la puerta. Dirección tipeada: hace falta el número.
  if (!hit.fromMap && !hit.number) miss.push("number");
  if (!hit.city) miss.push("city");
  if (!hit.country && !hit.countryCode) miss.push("country");
  return miss;
}
