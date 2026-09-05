import { averageStars } from "./merchant-grade.ts";
import { keyFromUrl } from "./socials.ts";
import type { Community, CommunityLink } from "./entities";

const ID_KEYS = new Set(["web", "x", "nostr", "telegram", "github"]);

const FOUNDING = new Set(["cc-btc", "c:cc-btc", "conciencia-bitcoin", "consciencia-bitcoin"]);

function isFounding(c: { id?: string; slug?: string }) {
  return FOUNDING.has((c.slug || "").toLowerCase()) || FOUNDING.has((c.id || "").toLowerCase());
}

export function listingTrust(
  links: { key?: string; url: string }[] | undefined,
  score: number,
  count: number,
  scraped = false,
) {
  const rows = links ?? [];
  const identity = rows.length >= 2 && rows.some((l) => ID_KEYS.has(l.key || keyFromUrl(l.url)));
  const reputation = count >= 3 && score >= 4;
  return {
    identity,
    reputation,
    scraped,
    verified: identity || reputation || scraped,
    avg: count > 0 ? score : null,
    count,
    socials: rows.length,
  };
}

export function communityTrust(c: Community) {
  const count = c.voteCount ?? c.votes?.length ?? 0;
  const score = count ? (c.score ?? averageStars(c.votes ?? []) ?? 0) : 0;
  const scraped = (c.verifiedAt ?? 0) > 0;
  const base = listingTrust(c.links, score, count, scraped);
  if (isFounding(c)) return { ...base, verified: true, identity: true };
  return base;
}

export function hasScrapeLink(links: { key?: string; url: string }[] | undefined) {
  return (links ?? []).some((l) => {
    const u = (l.url || "").trim();
    return /^https?:\/\//i.test(u);
  });
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