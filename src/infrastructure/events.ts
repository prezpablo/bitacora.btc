import type { ContinentId, EventKind, EventsPayload, NetworkEvent } from "@/domain";
import { continentFromLabel, continentOf, eventIsLive, isoFromCountryName } from "@/domain";

const BTC =
  /\b(bitcoin|btc|sats?|satoshi|lightning|nostr|ordinals?|taproot|runes?|bitaxe|mempool|hodl|bitcoiner|satsconf|adopting bitcoin|plan b)\b/i;

const LUMA_Q = [
  "bitcoin",
  "btc meetup",
  "lightning bitcoin",
  "nostr bitcoin",
  "ordinals bitcoin",
  "bitcoin conference",
  "satsconf",
  "adopting bitcoin",
];

const UA = "bitacora.btc/1.0 (https://bitacora.btc)";

const MEETUP_HUBS: { lat: number; lon: number; tz: string }[] = [
  { lat: -34.6037, lon: -58.3816, tz: "America/Argentina/Buenos_Aires" },
  { lat: -23.5505, lon: -46.6333, tz: "America/Sao_Paulo" },
  { lat: 19.4326, lon: -99.1332, tz: "America/Mexico_City" },
  { lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  { lat: 52.52, lon: 13.405, tz: "Europe/Berlin" },
  { lat: 6.5244, lon: 3.3792, tz: "Africa/Lagos" },
  { lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo" },
  { lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore" },
  { lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney" },
];

type LumaEvent = {
  api_id?: string;
  name?: string;
  url?: string;
  cover_url?: string;
  social_image_url?: string;
  start_at?: string;
  end_at?: string;
  timezone?: string;
  calendar_api_id?: string;
  geo_address_info?: {
    city?: string;
    country?: string;
    country_code?: string;
    city_state?: string;
    address?: string;
    region?: string;
  };
  location_type?: string;
};

type LumaEntry = {
  api_id?: string;
  event?: LumaEvent;
  calendar?: { name?: string; description_short?: string; api_id?: string };
};

const TTL = 5 * 60_000;
let cache: { at: number; payload: EventsPayload } | null = null;

function lumaUrl(slug: string) {
  if (!slug) return "https://luma.com";
  if (slug.startsWith("http")) return slug;
  return `https://luma.com/${slug}`;
}

function kindOf(title: string, locationType?: string): EventKind {
  const loc = (locationType || "").toLowerCase();
  if (loc === "online" || loc === "virtual") return "online";
  const s = title.toLowerCase();
  if (/\b(hackathon|hackerhouse|hack house)\b/.test(s)) return "hackathon";
  if (/\b(workshop|book club|curso|course|taller|class)\b/.test(s)) return "workshop";
  if (/\b(conference|summit|forum|congress|conf)\b/.test(s)) return "conference";
  if (/\b(meetup|meet-up|bitcoiner|node|club)\b/.test(s)) return "meetup";
  return "other";
}

function normTitle(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stamp(e: NetworkEvent) {
  const t = e.startAt - (e.startAt % 60_000);
  return `${normTitle(e.title)}|${t}|${normTitle(e.city)}|${e.countryCode}`;
}

function cont(code: string, online: boolean, label?: string): ContinentId | "" {
  if (online) return "online";
  return continentOf(code) || continentFromLabel(label || "") || "";
}

function parseZoned(date: string, time: string, tz?: string) {
  const [Y, M, D] = date.split("-").map(Number);
  const [h, m] = (time || "00:00").split(":").map(Number);
  if (!Y || !M || !D) return NaN;
  let guess = Date.UTC(Y, M - 1, D, h || 0, m || 0);
  if (!tz) return guess;
  try {
    for (let i = 0; i < 3; i++) {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(new Date(guess));
      const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
      const actual = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
      const desired = Date.UTC(Y, M - 1, D, h || 0, m || 0);
      guess += desired - actual;
    }
    return guess;
  } catch {
    return guess;
  }
}

function fromLuma(entry: LumaEntry): NetworkEvent | null {
  const ev = entry.event;
  if (!ev?.name || !ev.start_at) return null;
  const blob = `${ev.name} ${entry.calendar?.name || ""} ${entry.calendar?.description_short || ""}`;
  if (!BTC.test(blob)) return null;
  const startAt = Date.parse(ev.start_at);
  const endAt = ev.end_at ? Date.parse(ev.end_at) : undefined;
  if (!Number.isFinite(startAt)) return null;
  if (!eventIsLive({ startAt, endAt })) return null;
  const geo = ev.geo_address_info || {};
  const city = geo.city || "";
  const region = geo.region || geo.city_state || city;
  const country = geo.country || "";
  const countryCode = (geo.country_code || "").toUpperCase();
  const kind = kindOf(ev.name, ev.location_type);
  const desc =
    (entry.calendar?.description_short || "").trim() ||
    [entry.calendar?.name, geo.address, city, country].filter(Boolean).join(" · ");
  return {
    id: `luma:${ev.api_id || entry.api_id || ev.url}`,
    title: ev.name.trim(),
    description: desc.slice(0, 180),
    image: ev.cover_url || ev.social_image_url || "",
    startAt,
    endAt: Number.isFinite(endAt) ? endAt : undefined,
    timezone: ev.timezone,
    city,
    region,
    country,
    countryCode,
    continent: cont(countryCode, kind === "online"),
    url: lumaUrl(ev.url || ""),
    platform: "Luma",
    kind,
  };
}

async function lumaList(url: string): Promise<{ events: NetworkEvent[]; calendars: string[] }> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    cache: "no-store",
  });
  if (!res.ok) return { events: [], calendars: [] };
  const j = (await res.json()) as { entries?: LumaEntry[] };
  const calendars: string[] = [];
  const events: NetworkEvent[] = [];
  for (const entry of j.entries || []) {
    const cal = entry.event?.calendar_api_id || entry.calendar?.api_id;
    if (cal) calendars.push(cal);
    const ev = fromLuma(entry);
    if (ev) events.push(ev);
  }
  return { events, calendars };
}

async function fetchLuma(): Promise<NetworkEvent[]> {
  const searches = await Promise.all(
    LUMA_Q.map((q) =>
      lumaList(
        `https://api.lu.ma/discover/get-paginated-events?pagination_limit=50&query=${encodeURIComponent(q)}`,
      ).catch(() => ({ events: [] as NetworkEvent[], calendars: [] as string[] })),
    ),
  );
  const calIds = [...new Set(searches.flatMap((s) => s.calendars))].slice(0, 16);
  const extra = await Promise.all(
    calIds.map((id) =>
      lumaList(
        `https://api.lu.ma/calendar/get-items?calendar_api_id=${encodeURIComponent(id)}&period=future`,
      ).catch(() => ({ events: [] as NetworkEvent[], calendars: [] as string[] })),
    ),
  );
  return [...searches, ...extra].flatMap((s) => s.events);
}

type MeetupNode = {
  id?: string;
  title?: string;
  dateTime?: string;
  eventUrl?: string;
  eventType?: string;
  description?: string;
  venue?: { name?: string; city?: string; state?: string; country?: string };
  group?: { name?: string; timezone?: string };
  featuredEventPhoto?: { highResUrl?: string };
};

async function meetupHub(hub: { lat: number; lon: number; tz: string }): Promise<NetworkEvent[]> {
  const start = `${new Date().toISOString().slice(0, 19)}Z[UTC]`;
  const query = `
    query {
      eventSearch(
        filter: {
          query: "bitcoin"
          lat: ${hub.lat}
          lon: ${hub.lon}
          doConsolidateEvents: true
          startDateRange: "${start}"
        }
        sort: { sortField: DATETIME }
      ) {
        edges {
          node {
            id title dateTime eventUrl eventType description
            venue { name city state country }
            group { name timezone }
            featuredEventPhoto { highResUrl }
          }
        }
      }
    }`;
  const res = await fetch("https://www.meetup.com/gql2", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      origin: "https://www.meetup.com",
      referer: "https://www.meetup.com/find/",
      "user-agent": "Mozilla/5.0 bitacora.btc",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const j = (await res.json()) as {
    data?: { eventSearch?: { edges?: { node?: MeetupNode }[] } };
  };
  const rows: NetworkEvent[] = [];
  for (const edge of j.data?.eventSearch?.edges || []) {
    const n = edge.node;
    if (!n?.title || !n.dateTime) continue;
    const blob = `${n.title} ${n.description || ""} ${n.group?.name || ""}`;
    if (!BTC.test(blob)) continue;
    const startAt = Date.parse(n.dateTime);
    if (!eventIsLive({ startAt })) continue;
    const online = (n.eventType || "").toUpperCase() === "ONLINE";
    const countryCode = (n.venue?.country || "").toUpperCase();
    const city = n.venue?.city || "";
    const region = n.venue?.state || city;
    rows.push({
      id: `meetup:${n.id || n.eventUrl}`,
      title: n.title.trim(),
      description: (n.description || n.group?.name || "").replace(/\s+/g, " ").slice(0, 180),
      image: n.featuredEventPhoto?.highResUrl || "",
      startAt,
      timezone: n.group?.timezone || hub.tz,
      city,
      region,
      country: countryCode,
      countryCode: countryCode.length === 2 ? countryCode : isoFromCountryName(n.venue?.country || ""),
      continent: cont(countryCode.length === 2 ? countryCode : isoFromCountryName(n.venue?.country || ""), online),
      url: n.eventUrl || "https://www.meetup.com",
      platform: "Meetup",
      kind: online ? "online" : kindOf(n.title),
    });
  }
  return rows;
}

async function fetchMeetup(): Promise<NetworkEvent[]> {
  const packs = await Promise.all(MEETUP_HUBS.map((h) => meetupHub(h).catch(() => [] as NetworkEvent[])));
  return packs.flat();
}

type EbEvent = {
  id?: string;
  name?: string;
  url?: string;
  summary?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  timezone?: string;
  image_id?: string;
  is_online_event?: boolean;
  locations?: { type?: string; name?: string }[];
};

function ebCookies(headers: Headers) {
  const list =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie") || ""];
  const pairs = list.filter(Boolean).map((c) => c.split(";")[0]!);
  const cookie = pairs.join("; ");
  const csrf = /(?:^|;\s*)csrftoken=([^;]+)/.exec(cookie)?.[1] || "";
  return { cookie, csrf };
}

async function fetchEventbrite(): Promise<NetworkEvent[]> {
  const home = await fetch("https://www.eventbrite.com/", {
    headers: { accept: "text/html", "user-agent": "Mozilla/5.0 bitacora.btc" },
    cache: "no-store",
  });
  const { cookie, csrf } = ebCookies(home.headers);
  if (!csrf) return [];
  const pages = [1, 2];
  const packs = await Promise.all(
    pages.map(async (page) => {
      const res = await fetch("https://www.eventbrite.com/api/v3/destination/search/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          origin: "https://www.eventbrite.com",
          referer: "https://www.eventbrite.com/",
          "x-csrftoken": csrf,
          cookie,
          "user-agent": "Mozilla/5.0 bitacora.btc",
        },
        body: JSON.stringify({
          event_search: { q: "bitcoin", dates: "current_future", page, page_size: 20 },
        }),
        cache: "no-store",
      });
      if (!res.ok) return [] as EbEvent[];
      const j = (await res.json()) as { events?: { results?: EbEvent[] } };
      return j.events?.results || [];
    }),
  );
  const rows: NetworkEvent[] = [];
  for (const e of packs.flat()) {
    if (!e.name || !e.start_date) continue;
    const blob = `${e.name} ${e.summary || ""}`;
    if (!BTC.test(blob)) continue;
    const startAt = parseZoned(e.start_date, e.start_time || "00:00", e.timezone);
    const endAt =
      e.end_date && e.end_time ? parseZoned(e.end_date, e.end_time, e.timezone) : undefined;
    if (!eventIsLive({ startAt, endAt })) continue;
    const countryLoc = e.locations?.find((l) => l.type === "country")?.name || "";
    const regionLoc =
      e.locations?.find((l) => l.type === "region")?.name ||
      e.locations?.find((l) => l.type === "locality")?.name ||
      "";
    const cityLoc =
      e.locations?.find((l) => l.type === "neighbourhood" || l.type === "locality" || l.type === "city")
        ?.name || regionLoc;
    const continentLoc = e.locations?.find((l) => l.type === "continent")?.name || "";
    const countryCode = isoFromCountryName(countryLoc);
    const online = Boolean(e.is_online_event);
    rows.push({
      id: `eb:${e.id || e.url}`,
      title: e.name.trim(),
      description: (e.summary || "").replace(/\s+/g, " ").slice(0, 180),
      image: e.image_id
        ? `https://img.evbuc.com/https://cdn.evbuc.com/images/${e.image_id}/original.jpg?w=940&auto=format`
        : "",
      startAt,
      endAt: Number.isFinite(endAt) ? endAt : undefined,
      timezone: e.timezone,
      city: online ? "" : cityLoc,
      region: online ? "" : regionLoc,
      country: countryLoc,
      countryCode,
      continent: cont(countryCode, online, continentLoc),
      url: e.url || "https://www.eventbrite.com",
      platform: "Eventbrite",
      kind: online ? "online" : kindOf(e.name),
    });
  }
  return rows;
}

export async function fetchNetworkEvents(): Promise<EventsPayload> {
  const now = Date.now();
  if (cache && now - cache.at < TTL) return cache.payload;
  const [luma, meetup, eventbrite] = await Promise.all([
    fetchLuma().catch(() => [] as NetworkEvent[]),
    fetchMeetup().catch(() => [] as NetworkEvent[]),
    fetchEventbrite().catch(() => [] as NetworkEvent[]),
  ]);
  const seen = new Set<string>();
  const events = [...luma, ...meetup, ...eventbrite]
    .filter((e) => eventIsLive(e))
    .filter((e) => {
      const keys = [e.id, e.url, stamp(e)];
      if (keys.some((k) => seen.has(k))) return false;
      for (const k of keys) seen.add(k);
      return true;
    })
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, 120);

  const sources = [...new Set(events.map((e) => e.platform))];
  const payload: EventsPayload = { events, asOf: Date.now(), sources };
  cache = { at: Date.now(), payload };
  return payload;
}
