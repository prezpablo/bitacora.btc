import { averageStars } from "./merchant-grade.ts";
import { keyFromUrl } from "./socials.ts";
import type { Community, CommunityLink } from "./entities";
import { FOUNDING_DESCRIPTION, FOUNDING_LINKS, FOUNDING_UY } from "./globe.ts";

const ID_KEYS = new Set(["web", "x", "nostr", "telegram", "github"]);

const FOUNDING = new Set(["cc-btc", "c:cc-btc", "conciencia-bitcoin", "consciencia-bitcoin"]);

function isFounding(c: { id?: string; slug?: string }) {
  return FOUNDING.has((c.slug || "").toLowerCase()) || FOUNDING.has((c.id || "").toLowerCase());
}

/** Ficha canónica de Consciencia Bitcoin: texto + redes, aunque el overlay viejo venga vacío. */
export function withFoundingProfile<T extends { id?: string; slug?: string; description?: string; links?: CommunityLink[]; logo?: string }>(
  c: T,
): T {
  if (!isFounding(c)) return c;
  const links = c.links?.length ? c.links : FOUNDING_LINKS.map((l) => ({ ...l }));
  return {
    ...c,
    description: (c.description || "").trim() || FOUNDING_DESCRIPTION,
    links,
    logo: c.logo || FOUNDING_UY.logo,
  };
}

export function listingTrust(
  links: { key?: string; url: string }[] | undefined,
  score: number,
  count: number,
  scraped = false,
  overlay = false,
) {
  const rows = links ?? [];
  const identity = rows.length >= 2 && rows.some((l) => ID_KEYS.has(l.key || keyFromUrl(l.url)));
  const reputation = count >= 3 && score >= 4;
  return {
    identity,
    reputation,
    scraped,
    verified: overlay ? scraped : identity || reputation || scraped,
    avg: count > 0 ? score : null,
    count,
    socials: rows.length,
  };
}

export function communityTrust(c: Community) {
  const count = c.voteCount ?? c.votes?.length ?? 0;
  const score = count ? (c.score ?? averageStars(c.votes ?? []) ?? 0) : 0;
  const scraped = (c.verifiedAt ?? 0) > 0;
  const overlay = (c.id || "").startsWith("c:") && !isFounding(c);
  const base = listingTrust(c.links, score, count, scraped, overlay);
  if (isFounding(c)) return { ...base, verified: true, identity: true };
  return base;
}

export function hasScrapeLink(links: { key?: string; url: string }[] | undefined) {
  return (links ?? []).some((l) => {
    const u = (l.url || "").trim();
    return /^https?:\/\//i.test(u);
  });
}

export type ProofErr = "need" | "links" | "instagram";

/** Vacío = todavía no hay prueba (paso 1). Instagram solo si es post/reel. */
export function normalizeProofUrl(raw: string): { url: string } | { error: ProofErr } {
  const t = String(raw || "").trim();
  if (!t) return { error: "need" };
  if (/^javascript:/i.test(t) || /^data:/i.test(t)) return { error: "links" };
  const url = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const href = new URL(url).toString();
    if (!/^https?:\/\//i.test(href)) return { error: "links" };
    if (/instagram\.com/i.test(href) && !/instagram\.com\/(?:p|reel|reels|tv)\//i.test(href)) {
      return { error: "instagram" };
    }
    return { url: href.slice(0, 300) };
  } catch {
    return { error: "links" };
  }
}

export function shopIsPublic(id: string, verifiedAt?: number) {
  if (id.startsWith("btcmap:") || id.startsWith("node:") || id.startsWith("osm:")) return true;
  if (!id.startsWith("local:")) return true;
  return (verifiedAt ?? 0) > 0;
}

/** User-submitted community (`c:`) stays off the map until CARGA is scraped. Catalog/founding stay. */
export function communityIsPublic(c: { id?: string; slug?: string; verifiedAt?: number }) {
  if (isFounding(c)) return true;
  const id = c.id || "";
  if (id.startsWith("btcmap:")) return true;
  if (id.startsWith("c:")) return (c.verifiedAt ?? 0) > 0;
  return (c.verifiedAt ?? 0) > 0 || !id.startsWith("c:");
}

/** Carga del usuario aún no scrapeada. Catalog/btcmap no pasan por acá. */
export function overlayPending(id: string, verifiedAt?: number) {
  if ((verifiedAt ?? 0) > 0) return false;
  if (id.startsWith("local:")) return true;
  if (id.startsWith("c:") && !isFounding({ id })) return true;
  return false;
}

export type CargaGate = "ok" | "missing" | "live" | "token";

/** Overlay pending + matching token. Never mints. Catalog / founding / already-live stay out. */
export function cargaVerifyGate(
  row: { id: string; token?: string; verifiedAt?: number } | undefined,
  givenToken?: string,
): CargaGate {
  if (!row) return "missing";
  if (!overlayPending(row.id, row.verifiedAt)) return "live";
  const given = (givenToken || "").trim();
  if (!row.token || !given || given !== row.token) return "token";
  return "ok";
}
