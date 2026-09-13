import type { ContinentId } from "./geo-regions.ts";
import { continentOf } from "./geo-regions.ts";
import { eventIsLive, type EventKind, type NetworkEvent } from "./entities.ts";

export const EVENT_PAGE = 9;
export const EVENT_PAGE_MOBILE = 6;

export function eventPageSize(n?: number) {
  return n === EVENT_PAGE_MOBILE ? EVENT_PAGE_MOBILE : EVENT_PAGE;
}

export type EventBoardQuery = {
  page?: number;
  size?: number;
  dir?: "asc" | "desc";
  continent?: ContinentId | "";
  country?: string;
  countryName?: string;
  platform?: string;
  kind?: EventKind | "";
};

export type EventFacets = {
  kinds: Partial<Record<EventKind, number>>;
  platforms: [string, number][];
  countries: { continent: ContinentId; code: string; name: string }[];
  live: number;
};

export type EventBoardPage = {
  events: NetworkEvent[];
  total: number;
  page: number;
  pages: number;
  size: number;
  dir: "asc" | "desc";
  asOf: number;
  sources: string[];
  facets: EventFacets;
};

const KINDS = new Set<EventKind>(["meetup", "conference", "workshop", "hackathon", "online", "other"]);
const CONTS = new Set<ContinentId>(["americas", "europe", "africa", "asia", "oceania", "online"]);

export function sortEventsByDate<T extends { startAt: number }>(rows: T[], dir: "asc" | "desc") {
  const copy = rows.slice();
  copy.sort((a, b) => (dir === "asc" ? a.startAt - b.startAt : b.startAt - a.startAt));
  return copy;
}

export function pageEvents<T>(rows: T[], page: number, size = EVENT_PAGE) {
  const pages = Math.max(1, Math.ceil(rows.length / size) || 1);
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * size;
  return { page: p, pages, slice: rows.slice(start, start + size) };
}

export function eventContinent(e: Pick<NetworkEvent, "kind" | "continent" | "countryCode">): ContinentId | "" {
  if (e.kind === "online") return "online";
  return e.continent || continentOf(e.countryCode);
}

export function sameCountry(e: Pick<NetworkEvent, "countryCode" | "country">, code: string, name?: string) {
  const want = code.toUpperCase();
  const got = (e.countryCode || "").toUpperCase();
  if (want && got && got === want) return true;
  if (name && e.country && e.country.toLowerCase() === name.toLowerCase()) return true;
  return false;
}

export function buildEventBoard(
  raw: NetworkEvent[],
  query: EventBoardQuery = {},
  meta: { asOf?: number; sources?: string[] } = {},
  now = Date.now(),
): EventBoardPage {
  const live = raw.filter((e) => eventIsLive(e, now));
  const size = eventPageSize(query.size);
  const dir = query.dir === "desc" ? "desc" : "asc";
  const continent = query.continent || "";
  const country = (query.country || "").toUpperCase();
  const platform = query.platform || "";
  const kind = query.kind && KINDS.has(query.kind) ? query.kind : "";

  const countries: EventFacets["countries"] = [];
  const seen = new Set<string>();
  for (const e of live) {
    const cont = eventContinent(e);
    if (!cont || cont === "online" || !e.countryCode) continue;
    const code = e.countryCode.toUpperCase();
    if (seen.has(code)) continue;
    seen.add(code);
    countries.push({ continent: cont, code, name: e.country || code });
  }

  const geo = live.filter((e) => {
    if (continent && eventContinent(e) !== continent) return false;
    if (country && !sameCountry(e, country, query.countryName)) return false;
    return true;
  });

  const platformsMap = new Map<string, number>();
  for (const e of geo) platformsMap.set(e.platform, (platformsMap.get(e.platform) || 0) + 1);

  const scoped = platform ? geo.filter((e) => e.platform === platform) : geo;
  const kinds: Partial<Record<EventKind, number>> = {};
  for (const e of scoped) kinds[e.kind] = (kinds[e.kind] || 0) + 1;

  const matched = kind ? scoped.filter((e) => e.kind === kind) : scoped;
  const ordered = sortEventsByDate(matched, dir);
  const paged = pageEvents(ordered, query.page ?? 1, size);

  return {
    events: paged.slice,
    total: ordered.length,
    page: paged.page,
    pages: paged.pages,
    size,
    dir,
    asOf: meta.asOf ?? now,
    sources: meta.sources ?? [...new Set(live.map((e) => e.platform))],
    facets: {
      kinds,
      platforms: [...platformsMap.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      countries,
      live: live.length,
    },
  };
}

export function eventQueryFromSearch(search: string | URLSearchParams): EventBoardQuery {
  const s = typeof search === "string" ? new URLSearchParams(search.replace(/^\?/, "")) : search;
  const page = Math.max(1, Math.floor(Number(s.get("ep")) || 1));
  const kindRaw = s.get("ekind") || "";
  const continentRaw = s.get("econt") || "";
  return {
    page,
    dir: s.get("edir") === "desc" ? "desc" : "asc",
    kind: KINDS.has(kindRaw as EventKind) ? (kindRaw as EventKind) : "",
    platform: (s.get("eplat") || "").slice(0, 40),
    country: (s.get("eco") || "").toUpperCase().slice(0, 4),
    continent: CONTS.has(continentRaw as ContinentId) ? (continentRaw as ContinentId) : "",
  };
}

export function applyEventQuery(params: URLSearchParams, q: EventBoardQuery) {
  const set = (key: string, value: string) => {
    if (!value) params.delete(key);
    else params.set(key, value);
  };
  set("ep", q.page && q.page > 1 ? String(q.page) : "");
  set("edir", q.dir === "desc" ? "desc" : "");
  set("ekind", q.kind || "");
  set("eplat", q.platform || "");
  set("eco", q.country || "");
  set("econt", q.continent || "");
  return params;
}
