import { createServerFn } from "@tanstack/react-start";
import type { ChartRange, Community, CommunityFeed, DeskExtras, EtfFlowPayload, EventsPayload, LiqRange, MarketPayload, MarketTick, MerchantPlace, OnchainPayload, PulsePayload } from "@/domain";
import type { GlobeStats } from "@/domain/globe";
import { fetchDeskExtras, fetchLiveMarket, fetchTick } from "./compose";
import { fetchEtfFlows, fetchOnchainLive, fetchPulse } from "./extra-feeds";
import { fetchBtcCommunities, fetchMerchants, searchCities, searchMerchants } from "./btc-map";
import { clearGlobeStatsCache, fetchGlobeStats } from "./globe-stats";
import { fetchCommunityFeed } from "./community-feed";
import { fetchNetworkEvents } from "./events";
import { nominatimCity, type CityFrame } from "./geo";
import { searchStreets, type StreetHit } from "./address";
import { loadMapCsvText, saveMapCsvText, savePublicMapCsv } from "./map-csv-io";
import { loadPins, savePins, replacePins, countPendingPins } from "./pins-io";
import { scrapeShowsToken } from "./pin-verify";
import { enqueuePendingMap, enqueuePendingPins } from "./pin-queue";
import { persistContact, MAIL_RE, mailboxDomainOk, contactRelay, ackRelay, forwardFormSubmit, forwardAck } from "./contact-mail";
import { clientKey, tooMany } from "./rate-limit";
import { isPublicHttp } from "./safe-fetch";
import { issueCaptchaTicket, consumeCaptchaTicket } from "./captcha-ticket";
import { makePinToken, pinOnBoard, PIN_TTL_MS, type CommunityPin } from "@/domain/community-pins";
import { parseMapCsv, socialsFromCsv, stringifyMapCsv, stringifyMapCsvPublic } from "@/domain/map-csv";

export const getMarket = createServerFn({ method: "POST" })
  .validator((input: { range: ChartRange; liq: LiqRange }) => input)
  .handler(async ({ data }): Promise<MarketPayload> => {
    return await fetchLiveMarket(data.range, data.liq);
  });

export const getDeskExtras = createServerFn({ method: "POST" })
  .validator((input: { range: ChartRange }) => input)
  .handler(async ({ data }): Promise<DeskExtras> => {
    return await fetchDeskExtras(data.range);
  });

export const getTick = createServerFn({ method: "POST" }).handler(async (): Promise<MarketTick> => {
  return await fetchTick();
});

export const getOnchainLive = createServerFn({ method: "POST" }).handler(async (): Promise<Partial<OnchainPayload>> => {
  return await fetchOnchainLive();
});

export const getEtfFlows = createServerFn({ method: "POST" }).handler(async (): Promise<EtfFlowPayload | null> => {
  try {
    return await fetchEtfFlows();
  } catch {
    return null;
  }
});

export const getPulse = createServerFn({ method: "POST" })
  .validator((input: { lang?: string }) => input)
  .handler(async ({ data }): Promise<PulsePayload> => {
    return await fetchPulse(data?.lang);
  });

export const getGlobeStats = createServerFn({ method: "POST" }).handler(async (): Promise<GlobeStats> => {
  try {
    return await fetchGlobeStats();
  } catch {
    return { world: { shops: 0, comms: 0, events: 0, cities: 0 }, countries: [], points: [], overlay: [], asOf: Date.now() };
  }
});

export const getBtcCommunities = createServerFn({ method: "POST" }).handler(async (): Promise<Community[]> => {
  try {
    return await fetchBtcCommunities();
  } catch {
    return [];
  }
});

export const getMerchants = createServerFn({ method: "POST" })
  .validator((input: { west: number; south: number; east: number; north: number }) => input)
  .handler(async ({ data }): Promise<MerchantPlace[]> => {
    return await fetchMerchants(data);
  });

export const searchMap = createServerFn({ method: "POST" })
  .validator((input: { q: string }) => input)
  .handler(async ({ data }): Promise<{ places: MerchantPlace[]; cities: { label: string; lat: number; lon: number }[] }> => {
    const q = data.q.trim();
    const [places, cities] = await Promise.all([searchMerchants(q), searchCities(q)]);
    return { places, cities };
  });

export const getCommunityFeed = createServerFn({ method: "POST" }).handler(async (): Promise<CommunityFeed> => {
  return await fetchCommunityFeed();
});

export const getNetworkEvents = createServerFn({ method: "POST" }).handler(async (): Promise<EventsPayload> => {
  return await fetchNetworkEvents();
});

export const getCityFrame = createServerFn({ method: "POST" })
  .validator((input: { lat: number; lon: number; zoom?: number }) => input)
  .handler(async ({ data }): Promise<CityFrame> => {
    if (tooMany(clientKey("geo"), 40, 60 * 60_000) || tooMany("geo:global", 240, 60 * 60_000)) {
      return { lat: data.lat, lon: data.lon, south: data.lat - 0.14, north: data.lat + 0.14, west: data.lon - 0.18, east: data.lon + 0.18, label: "" };
    }
    return await nominatimCity(data.lat, data.lon, data.zoom ?? 10);
  });

export const searchAddress = createServerFn({ method: "POST" })
  .validator((input: { q: string; lang?: string }) => input)
  .handler(async ({ data }): Promise<StreetHit[]> => {
    if (tooMany(clientKey("addr"), 40, 60 * 60_000) || tooMany("addr:global", 240, 60 * 60_000)) return [];
    return await searchStreets(data.q, data.lang || "es");
  });

export const getMapCsv = createServerFn({ method: "POST" }).handler(async (): Promise<string> => {
  const text = await loadMapCsvText();
  try {
    const rows = parseMapCsv(text);
    const pending = rows
      .filter((r) => (r.id.startsWith("local:") || r.id.startsWith("c:")) && r.token && !r.verifiedAt)
      .map((r) => r.id);
    enqueuePendingMap(pending);
    return stringifyMapCsvPublic(rows);
  } catch {
    /* queue optional */
  }
  return stringifyMapCsvPublic(parseMapCsv(text));
});

export const issueCaptcha = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ id: string; code: string; salt: string; bits: number } | null> => {
    return issueCaptchaTicket();
  },
);

export const saveMapCsv = createServerFn({ method: "POST" })
  .validator((input: { csv: string; captchaId?: string; captcha?: string; captchaNonce?: string; hp?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (tooMany(clientKey("csv"), 6, 60 * 60_000)) return { ok: false };
    if (!consumeCaptchaTicket(data.captchaId || "", data.captcha || "", data.hp || "", data.captchaNonce || "")) return { ok: false };
    const ok = await savePublicMapCsv(data.csv);
    if (ok) clearGlobeStatsCache();
    return { ok };
  });

function safeHttp(raw: string) {
  let u = raw.trim();
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  if (!isPublicHttp(u)) return "";
  try {
    return new URL(u).toString();
  } catch {
    return "";
  }
}

export const getCommunityPins = createServerFn({ method: "POST" }).handler(async (): Promise<CommunityPin[]> => {
  try {
    const rows = await loadPins();
    enqueuePendingPins(rows.filter((p) => !p.verified && Date.now() - p.created < PIN_TTL_MS).map((p) => p.id));
    return rows
      .filter((p) => pinOnBoard(p))
      .slice(0, 48)
      .map((p) => ({ ...p, token: "" }));
  } catch {
    return [];
  }
});

export const submitCommunityPin = createServerFn({ method: "POST" })
  .validator((input: { name: string; blurb: string; proof: string; links?: string[]; captchaId?: string; captcha?: string; captchaNonce?: string; hp?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; token?: string; id?: string; error?: string }> => {
    if (!consumeCaptchaTicket(data.captchaId || "", data.captcha || "", data.hp || "", data.captchaNonce || "")) return { ok: false, error: "captcha" };
    const name = data.name.trim().slice(0, 80);
    const blurb = data.blurb.trim().slice(0, 220);
    const proof = safeHttp(data.proof);
    if (!name || !proof) return { ok: false, error: "need" };
    if (tooMany(clientKey("pin"), 8, 60 * 60_000)) return { ok: false, error: "rate" };
    if (tooMany("pin:global", 30, 60 * 60_000)) return { ok: false, error: "rate" };
    if ((await countPendingPins()) >= 80) return { ok: false, error: "rate" };
    const links = (data.links || []).map(safeHttp).filter(Boolean).slice(0, 6);
    const pin: CommunityPin = {
      id: `pin:${Date.now().toString(36)}`,
      name,
      blurb,
      proof,
      links,
      token: makePinToken(),
      verified: false,
      verifiedAt: 0,
      created: Date.now(),
    };
    const rows = await loadPins();
    const fresh = rows.filter((p) => Date.now() - p.created < 40 * PIN_TTL_MS);
    try {
      await savePins([...fresh, pin]);
    } catch {
      return { ok: false, error: "save" };
    }
    return { ok: true, token: pin.token, id: pin.id };
  });

export const verifyCommunityPin = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (tooMany(clientKey("pin-verify-burst"), 5, 5_000)) return { ok: false, error: "rate" };
    if (tooMany(clientKey("pin-verify"), 12, 60 * 60_000)) return { ok: false, error: "rate" };
    if (tooMany("pin-verify:global", 80, 60 * 60_000)) return { ok: false, error: "rate" };
    const rows = await loadPins();
    const pin = rows.find((p) => p.id === data.id);
    if (!pin) return { ok: false, error: "missing" };
    const hit = await scrapeShowsToken(pin.proof, pin.token, pin.links);
    if (!hit) {
      const ig = /instagram\.com/i.test(pin.proof);
      return { ok: false, error: ig ? "instagram" : "proof" };
    }
    pin.verified = true;
    pin.verifiedAt = Date.now();
    await savePins(rows);
    return { ok: true };
  });

export const cancelCommunityPin = createServerFn({ method: "POST" })
  .validator((input: { id: string; token: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const token = (data.token || "").trim();
    if (!token) return { ok: false, error: "token" };
    const rows = await loadPins();
    const pin = rows.find((p) => p.id === data.id);
    if (!pin) return { ok: true };
    if (pin.verified) return { ok: false, error: "live" };
    if (pin.token !== token) return { ok: false, error: "token" };
    await replacePins(rows.filter((p) => p.id !== data.id));
    return { ok: true };
  });

export const verifyMapListing = createServerFn({ method: "POST" })
  .validator((input: { id: string; token?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; token?: string; error?: string }> => {
    if (tooMany(clientKey("map-verify-burst"), 5, 5_000)) return { ok: false, token: data.token, error: "rate" };
    if (tooMany(clientKey("map-verify"), 12, 60 * 60_000)) return { ok: false, token: data.token, error: "rate" };
    if (tooMany("map-verify:global", 80, 60 * 60_000)) return { ok: false, token: data.token, error: "rate" };
    const text = await loadMapCsvText();
    const rows = parseMapCsv(text);
    const row = rows.find((r) => r.id === data.id);
    if (!row) return { ok: false, error: "missing" };
    if (!row.token) row.token = (data.token || makePinToken()).toUpperCase();
    const urls = socialsFromCsv(row.socials).map((l) => l.url).filter(Boolean);
    if (!urls.length) return { ok: false, token: row.token, error: "links" };
    const hit = await scrapeShowsToken(urls[0]!, row.token, urls.slice(1));
    if (!hit) return { ok: false, token: row.token, error: "proof" };
    row.verifiedAt = Date.now();
    await saveMapCsvText(stringifyMapCsv(rows));
    return { ok: true, token: row.token };
  });

const contactHits = new Map<string, number>();

export const sendContact = createServerFn({ method: "POST" })
  .validator((input: { name: string; email: string; message: string; topic?: string; auto?: string; hp?: string; captchaId?: string; captcha?: string; captchaNonce?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string; relay?: string; ack?: string; subject?: string; activate?: boolean }> => {
    if ((data.hp || "").trim()) return { ok: true };
    if (!consumeCaptchaTicket(data.captchaId || "", data.captcha || "", data.hp || "", data.captchaNonce || "")) return { ok: false, error: "captcha" };
    const name = (data.name || "").trim().slice(0, 80);
    const email = (data.email || "").trim().toLowerCase().slice(0, 120);
    const message = (data.message || "").trim().slice(0, 2000);
    const topic = (data.topic || "general").slice(0, 24);
    const auto = (data.auto || "").trim().slice(0, 2000);
    if (name.length < 2 || message.length < 2) return { ok: false, error: "need" };
    if (!MAIL_RE.test(email)) return { ok: false, error: "email" };
    if (!(await mailboxDomainOk(email))) return { ok: false, error: "email" };
    const now = Date.now();
    const stamp = contactHits.get(email) || 0;
    if (now - stamp < 12_000) return { ok: false, error: "rate" };
    if (tooMany(clientKey(`mail:${email}`), 5, 60 * 60_000)) return { ok: false, error: "rate" };
    await persistContact({ name, email, message, topic, auto });
    contactHits.set(email, now);
    const payload = { name, email, message, topic, auto };
    const [sent, ack] = await Promise.all([forwardFormSubmit(payload), forwardAck(payload)]);
    const relay = contactRelay();
    const ackUrl = ackRelay(email).url;
    const activate = sent === "activate" || ack === "activate";
    if (sent === "ok" && ack === "ok") return { ok: true, subject: `${relay.subject} · ${topic}`, activate };
    return {
      ok: true,
      relay: sent === "ok" ? undefined : relay.url,
      ack: ack === "ok" ? undefined : ackUrl,
      subject: `${relay.subject} · ${topic}`,
      activate,
    };
  });
