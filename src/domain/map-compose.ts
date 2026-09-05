import type { Community, MerchantLocal, MerchantPlace, MerchantVote } from "./entities.ts";
import { makePinToken } from "./community-pins.ts";
import type { WeekHours } from "./hours.ts";
import type { PayKey } from "./pays.ts";
import type { SocialLink } from "./socials.ts";

function addScore(score: number, votes: number, stars: number) {
  const n = Math.max(0, Math.floor(votes) || 0);
  const prev = n === 0 ? 0 : Number(score) || 0;
  const next = n + 1;
  return { score: (prev * n + stars) / next, votes: next };
}

function safeLogo(raw: string) {
  const t = String(raw || "").trim();
  if (!t || /^javascript:/i.test(t)) return "";
  if (t.startsWith("data:") && !/^data:image\//i.test(t)) return "";
  return t;
}

export function slugifyName(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export function localShopId(lat: number, lon: number) {
  return `local:${lat.toFixed(5)},${lon.toFixed(5)}`;
}

export type ShopDraft = {
  name: string;
  description: string;
  notes: string;
  hours: WeekHours;
  pays: PayKey[];
  address: string;
  logo: string;
  links: SocialLink[];
  stars: 1 | 2 | 3 | 4 | 5;
  nick: string;
};

export type CommDraft = {
  slug: string;
  name: string;
  description: string;
  logo: string;
  links: SocialLink[];
};

export type ComposeErr = "name" | "slug" | "slugTaken";

export function draftShop(
  drop: { lat: number; lon: number },
  d: ShopDraft,
  now = Date.now(),
): { place: MerchantPlace; local: MerchantLocal } | { error: ComposeErr } {
  const name = d.name.trim().slice(0, 80);
  if (!name) return { error: "name" };
  const id = localShopId(drop.lat, drop.lon);
  const tally = addScore(0, 0, d.stars);
  const by = d.nick.trim() || "colaborador";
  const place: MerchantPlace = {
    id,
    lat: drop.lat,
    lon: drop.lon,
    name,
    category: "propuesta",
    createdAt: now,
    description: d.description.trim() || undefined,
  };
  const local: MerchantLocal = {
    description: d.description.trim(),
    notes: d.notes.trim(),
    votes: [{ stars: d.stars, at: now, by }],
    listedAt: now,
    updatedAt: now,
    score: tally.score,
    voteCount: tally.votes,
    links: d.links,
    hours: d.hours,
    pays: d.pays,
    address: d.address.trim(),
    logo: safeLogo(d.logo) || undefined,
    lat: drop.lat,
    lon: drop.lon,
    name,
    category: "propuesta",
    verifyToken: makePinToken(),
  };
  return { place, local };
}

export function draftCommunity(
  drop: { lat: number; lon: number },
  d: CommDraft,
  taken: string[],
  now = Date.now(),
): { row: Community } | { error: ComposeErr } {
  const slug = slugifyName(d.slug || d.name);
  if (!slug) return { error: "slug" };
  if (taken.includes(slug)) return { error: "slugTaken" };
  return {
    row: {
      id: `c:${slug}`,
      slug,
      name: d.name.trim() || slug,
      lat: drop.lat,
      lon: drop.lon,
      logo: safeLogo(d.logo) || d.logo || "",
      description: d.description.trim(),
      links: d.links as Community["links"],
      createdAt: now,
      votes: [],
      verifyToken: makePinToken(),
    },
  };
}

export function rateLocal(
  prev: MerchantLocal,
  stars: 1 | 2 | 3 | 4 | 5,
  nick: string,
  description: string,
  now = Date.now(),
): MerchantLocal {
  const by = nick.trim() || "colaborador";
  const tally = addScore(prev.score ?? 0, prev.voteCount ?? prev.votes.length, stars);
  return {
    ...prev,
    description: description.trim() || prev.description,
    votes: [...prev.votes, { stars, at: now, by } satisfies MerchantVote],
    listedAt: prev.listedAt || now,
    updatedAt: now,
    score: tally.score,
    voteCount: tally.votes,
  };
}

export function rateCommunity(
  c: Community,
  stars: 1 | 2 | 3 | 4 | 5,
  nick: string,
  now = Date.now(),
): Community {
  const by = nick.trim() || "colaborador";
  const tally = addScore(c.score ?? 0, c.voteCount ?? c.votes?.length ?? 0, stars);
  return {
    ...c,
    votes: [...(c.votes ?? []), { stars, at: now, by }],
    score: tally.score,
    voteCount: tally.votes,
  };
}
