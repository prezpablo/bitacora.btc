import { listingTrust } from "./verify.ts";

const FOUNDING = new Set(["cc-btc", "c:cc-btc", "conciencia-bitcoin", "consciencia-bitcoin"]);

export function cargaTokenOk(stored: string, given: string) {
  const a = String(stored || "").trim();
  const b = String(given || "").trim();
  if (!a || !b || a.length > 24 || b.length > 24) return false;
  return a === b;
}

/** La misma regla que la estrella del mapa. El alta propia sin CARGA no la tiene. */
export function publicRowStarred(
  row: { id: string; score: number; votes: number; verifiedAt: number },
  links: { key?: string; url: string }[],
) {
  if ((row.verifiedAt || 0) > 0) return true;
  const id = (row.id || "").toLowerCase();
  if (FOUNDING.has(id)) return true;
  const overlay = id.startsWith("local:") || id.startsWith("c:");
  return listingTrust(links, row.score || 0, row.votes || 0, false, overlay).verified;
}

export function publicBrandAllowed(starred: boolean, storedToken: string, givenToken: string) {
  return !starred || cargaTokenOk(storedToken, givenToken);
}
