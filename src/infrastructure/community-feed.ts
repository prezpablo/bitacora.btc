import type { CommunityFeed, CommunityPost } from "@/domain";

type SnItem = {
  id: string;
  title?: string;
  text?: string | null;
  createdAt?: string;
  ncomments?: number;
  sats?: number;
  url?: string | null;
  user?: { name?: string | null } | null;
};

const SUBS = ["bitcoin", "lightning", "nostr"] as const;
const TTL = 90_000;
let cache: { at: number; feed: CommunityFeed } | null = null;

function strip(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function snSub(sub: string): Promise<CommunityPost[]> {
  const query = `{ items(sort: "recent", limit: 10, sub: "${sub}") { items { id title text createdAt ncomments sats url user { name } } } }`;
  const res = await fetch("https://stacker.news/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "bitacora.btc/1.0",
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: { items?: { items?: SnItem[] } } };
  const rows = json.data?.items?.items ?? [];
  return rows
    .filter((it) => (it.title || it.text || "").trim())
    .map((it) => {
      const title = strip(it.title || it.text || "Nota").slice(0, 180);
      const body = strip(it.text || "").slice(0, 220);
      return {
        id: `sn:${it.id}`,
        title,
        body: body === title ? "" : body,
        author: it.user?.name || "stacker",
        source: `~${sub}`,
        url: it.url || `https://stacker.news/items/${it.id}`,
        at: it.createdAt ? Date.parse(it.createdAt) : Date.now(),
        sats: Number(it.sats) || 0,
        comments: Number(it.ncomments) || 0,
      };
    });
}

export async function fetchCommunityFeed(): Promise<CommunityFeed> {
  const now = Date.now();
  if (cache && now - cache.at < TTL) return cache.feed;
  const packs = await Promise.all(SUBS.map((s) => snSub(s).catch(() => [] as CommunityPost[])));
  const seen = new Set<string>();
  const posts = packs
    .flat()
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .sort((a, b) => b.at - a.at)
    .slice(0, 24);
  const feed = { posts, asOf: Date.now() };
  cache = { at: Date.now(), feed };
  return feed;
}
