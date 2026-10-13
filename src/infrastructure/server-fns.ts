import { createServerFn } from "@tanstack/react-start";
import type { ChartRange, Community, CommunityFeed, DeskExtras, EtfFlowPayload, EventBoardPage, EventBoardQuery, LiqRange, MarketPayload, MarketTick, MerchantPlace, OnchainPayload, PulsePayload, ShopPin } from "@/domain";
import type { GlobeStats } from "@/domain/globe";
import { fetchLiveMarket, fetchTick } from "./compose";
import { fetchClarity, fetchEtfFlows, fetchFearGreed, fetchLiquidity, fetchOnchain, fetchOnchainLive, fetchPulse } from "./extra-feeds";
import { withLastKnown, readLast } from "./last-known.server";
import { fetchBtcCommunities, fetchMerchant, fetchMerchants, searchCities, searchMerchants } from "./btc-map";
import { clearGlobeStatsCache, fetchGlobeStats } from "./globe-stats";
import { fetchCommunityFeed } from "./community-feed";
import { fetchNetworkEvents } from "./events";
import { nominatimCity, requestBeaconFix, type CityFrame } from "./geo";
import { searchStreets, reverseStreet, nearbyStreets, type StreetHit } from "./address";
import { fetchGuidePath, type GuidePath } from "./osrm";
import { pickGuideMode, type GuideMode, type GuideStep } from "@/domain/guide";
import { buildEventBoard } from "@/domain/event-board";
import { loadMapCsvText, saveMapCsvText, savePublicMapCsv, countPendingMapRows, deleteUnverifiedMapRow } from "./map-csv-io";
import { loadPins, savePins, replacePins, countPendingPins } from "./pins-io";
import { loadPatches, savePatch, replacePatches, countPendingPatches, saveContactTicket } from "./patches-io";
import { scrapeShowsToken } from "./pin-verify";
import { enqueuePendingMap, enqueuePendingPins } from "./pin-queue";
import { persistContact, MAIL_RE, mailboxDomainOk, contactRelay, ackRelay, forwardFormSubmit, forwardAck } from "./contact-mail";
import { clientKey, peerFromHeaders, tooMany } from "./rate-limit";
import { getRequest } from "@tanstack/react-start/server";
import { isPublicHttp } from "./safe-fetch";
import { issueCaptchaTicket, consumeCaptchaTicket } from "./captcha-ticket";
import { makePinToken, pinAlive, PIN_TTL_MS, type CommunityPin } from "@/domain/community-pins";
import { localShopId, slugifyName } from "@/domain/map-compose";
import { applyListingPatch, proposeListingPatch } from "@/application/map-listings";
import { makeContactTicket, PATCH_TTL_MS, patchAlive } from "@/domain/listing-patch";
import { parseMapCsv, socialsFromCsv, socialsToCsv, stringifyMapCsv, stringifyMapCsvPublic, type MapCsvRow } from "@/domain/map-csv";
import { mergeLiveFees } from "@/domain/fees";
import { localeOf, translateFeed, translateNews } from "./translate";
import { normalizeProofUrl, cargaVerifyGate } from "@/domain/verify";

export const getMarket = createServerFn({ method: "POST" })
  .validator((input: { range: ChartRange; liq: LiqRange }) => input)
  .handler(async ({ data }): Promise<MarketPayload> => {
    return await fetchLiveMarket(data.range, data.liq);
  });

export const getDeskExtras = createServerFn({ method: "POST" })
  .validator((input: { range: ChartRange }) => input)
  .handler(async ({ data }): Promise<DeskExtras> => {
    const [onchain, clarity, fearGreed, liquidity, pulse] = await Promise.all([
      withLastKnown(
        "onchain",
        async () => {
          const d = await fetchOnchain(data.range);
          return mergeLiveFees(d, readLast<OnchainPayload>("onchain")?.data);
        },
        (d) => d.height > 0 || d.hashSeries.length > 0,
      ).catch(() => null),
      withLastKnown("clarity", fetchClarity, (d) => Number.isFinite(d.yes)).catch(() => null),
      withLastKnown("fear-greed", fetchFearGreed, (d) => Number.isFinite(d.value)).catch(() => null),
      withLastKnown("liquidity", fetchLiquidity, (d) => d.price > 0).catch(() => null),
      withLastKnown("pulse", fetchPulse, (d) => d.news.length > 0 || d.trends.length > 0).catch(() => null),
    ]);
    return { onchain, clarity, fearGreed, liquidity, pulse };
  });

export const getTick = createServerFn({ method: "POST" }).handler(async (): Promise<MarketTick> => {
  return await fetchTick();
});

export const getOnchainLive = createServerFn({ method: "POST" }).handler(async (): Promise<Partial<OnchainPayload>> => {
  return await withLastKnown(
    "onchain-live",
    async () => {
      const live = await fetchOnchainLive();
      return mergeLiveFees(live, readLast<Partial<OnchainPayload>>("onchain-live")?.data);
    },
    (d) => Boolean(d.height) || d.feeFast != null,
  );
});

export const getEtfFlows = createServerFn({ method: "POST" }).handler(async (): Promise<EtfFlowPayload | null> => {
  try {
    return await withLastKnown("etf", fetchEtfFlows, (d) => d.series.length > 0 || d.lastUsdM !== 0);
  } catch {
    return null;
  }
});

export const getPulse = createServerFn({ method: "POST" })
  .validator((input: { lang?: string }) => input)
  .handler(async ({ data }): Promise<PulsePayload> => {
    const raw = await withLastKnown("pulse", () => fetchPulse(data?.lang), (d) => d.news.length > 0 || d.trends.length > 0);
    const lang = localeOf(data?.lang);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    try {
      const { rows, status } = await translateNews(raw.news, lang, ctrl.signal);
      return { ...raw, news: rows, translate: { status } };
    } catch {
      return { ...raw, translate: { status: "off" } };
    } finally {
      clearTimeout(timer);
    }
  });

export const getGlobeStats = createServerFn({ method: "POST" }).handler(async (): Promise<GlobeStats> => {
  try {
    return await fetchGlobeStats();
  } catch {
    return { world: { shops: 0, comms: 0, events: 0, cities: 0 }, latam: { shops: 0, comms: 0, events: 0, cities: 0 }, countries: [], points: [], overlay: [], asOf: Date.now() };
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
  .validator((input: { west: number; south: number; east: number; north: number; zoom?: number }) => input)
  .handler(async ({ data }): Promise<ShopPin[]> => {
    try {
      return await fetchMerchants(data);
    } catch {
      return [];
    }
  });

export const getMerchant = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<MerchantPlace | null> => {
    try {
      return await fetchMerchant(data.id);
    } catch {
      return null;
    }
  });

export const searchMap = createServerFn({ method: "POST" })
  .validator((input: { q: string }) => input)
  .handler(async ({ data }): Promise<{ places: MerchantPlace[]; cities: { label: string; lat: number; lon: number }[] }> => {
    const q = data.q.trim();
    const [places, cities] = await Promise.all([searchMerchants(q), searchCities(q)]);
    return { places, cities };
  });

export const getCommunityFeed = createServerFn({ method: "POST" })
  .validator((input: { lang?: string } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<CommunityFeed> => {
    const raw = await fetchCommunityFeed();
    const lang = localeOf(data?.lang);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    try {
      const { rows } = await translateFeed(raw.posts, lang, ctrl.signal);
      const posts = raw.posts.map((p, i) => {
        const tr = rows[i];
        return tr ? { ...p, title: tr.title || p.title, body: tr.body || p.body } : p;
      });
      return { ...raw, posts };
    } catch {
      return raw;
    } finally {
      clearTimeout(timer);
    }
  });

export const getNetworkEvents = createServerFn({ method: "POST" })
  .validator((input: EventBoardQuery | undefined) => input ?? {})
  .handler(async ({ data }): Promise<EventBoardPage> => {
    const raw = await withLastKnown("events", fetchNetworkEvents, (d) => d.events.length > 0);
    return buildEventBoard(raw.events, data, { asOf: raw.asOf, sources: raw.sources });
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
  .validator((input: { q: string; lang?: string; lat?: number; lon?: number }) => input)
  .handler(async ({ data }): Promise<StreetHit[]> => {
    // Autocompletar pega más que reverse/nearby: bucket aparte para no dejar la lista vacía.
    if (tooMany(clientKey("addr-q"), 400, 60 * 60_000) || tooMany("addr-q:global", 4000, 60 * 60_000)) return [];
    const near =
      Number.isFinite(data.lat) && Number.isFinite(data.lon) ? { lat: Number(data.lat), lon: Number(data.lon) } : null;
    return await searchStreets(data.q, data.lang || "es", near);
  });

export const reverseAddress = createServerFn({ method: "POST" })
  .validator((input: { lat: number; lon: number; lang?: string }) => input)
  .handler(async ({ data }): Promise<StreetHit | null> => {
    if (tooMany(clientKey("addr-geo"), 80, 60 * 60_000) || tooMany("addr-geo:global", 800, 60 * 60_000)) return null;
    return await reverseStreet(data.lat, data.lon, data.lang || "es");
  });

export const nearbyAddress = createServerFn({ method: "POST" })
  .validator((input: { lat: number; lon: number; lang?: string }) => input)
  .handler(async ({ data }): Promise<StreetHit[]> => {
    if (tooMany(clientKey("addr-geo"), 80, 60 * 60_000) || tooMany("addr-geo:global", 800, 60 * 60_000)) return [];
    return await nearbyStreets(data.lat, data.lon, data.lang || "es");
  });

export const getGuidePath = createServerFn({ method: "POST" })
  .validator((input: { fromLat: number; fromLon: number; toLat: number; toLon: number }) => input)
  .handler(async ({ data }): Promise<{ path: GuidePath; mode: GuideMode; steps: GuideStep[]; distance: number; duration: number } | null> => {
    if (tooMany(clientKey("route"), 30, 60 * 60_000) || tooMany("route:global", 200, 60 * 60_000)) return null;
    const from = { lat: data.fromLat, lon: data.fromLon };
    const to = { lat: data.toLat, lon: data.toLon };
    if (![from.lat, from.lon, to.lat, to.lon].every(Number.isFinite)) return null;
    const mode = pickGuideMode(from, to);
    const route = await fetchGuidePath(from, to, mode);
    return {
      path: route.path.length >= 2 ? route.path : [from, to],
      mode: route.mode,
      steps: route.steps,
      distance: route.distance,
      duration: route.duration,
    };
  });

export const getApproxFix = createServerFn({ method: "POST" }).handler(async (): Promise<{ lat: number; lon: number; accuracy: number } | null> => {
  if (tooMany(clientKey("fix"), 40, 60 * 60_000) || tooMany("fix:global", 240, 60 * 60_000)) return null;
  let ip = "";
  try {
    ip = peerFromHeaders(getRequest().headers);
  } catch {
    ip = "";
  }
  try {
    const f = await requestBeaconFix(ip && ip !== "anon" ? ip : undefined);
    return { lat: f.lat, lon: f.lon, accuracy: f.accuracy };
  } catch {
    return null;
  }
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

export const submitMapListing = createServerFn({ method: "POST" })
  .validator((input: {
    kind: "shop" | "community";
    name: string;
    slug?: string;
    description?: string;
    notes?: string;
    address?: string;
    logo?: string;
    lat: number;
    lon: number;
    socials?: string;
    hours?: string;
    pays?: string;
    captchaId?: string;
    captcha?: string;
    captchaNonce?: string;
    hp?: string;
  }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; id?: string; token?: string; error?: string }> => {
    if ((data.hp || "").trim()) return { ok: true }; // honeypot: ok sin id/token, el formulario no avanza
    if (!consumeCaptchaTicket(data.captchaId || "", data.captcha || "", data.hp || "", data.captchaNonce || "")) {
      return { ok: false, error: "captcha" };
    }
    if (tooMany(clientKey("map-add"), 6, 60 * 60_000)) return { ok: false, error: "rate" };
    if (tooMany("map-add:global", 24, 60 * 60_000)) return { ok: false, error: "rate" };
    if ((await countPendingMapRows()) >= 80) return { ok: false, error: "rate" };
    const lat = Number(data.lat);
    const lon = Number(data.lon);
    const name = (data.name || "").trim().slice(0, 80);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return { ok: false, error: "need" };
    const rows = parseMapCsv(await loadMapCsvText());
    let id = "";
    if (data.kind === "community") {
      const slug = slugifyName(data.slug || data.name);
      if (!slug) return { ok: false, error: "slug" };
      id = `c:${slug}`;
    } else {
      id = localShopId(lat, lon);
    }
    const existing = rows.find((r) => r.id === id);
    if (existing?.verifiedAt) return { ok: false, error: data.kind === "community" ? "slugTaken" : "need" };
    if (existing) return { ok: false, error: "pending" };
    const row: MapCsvRow = {
      id,
      tipo: data.kind === "community" ? "community" : "shop",
      name,
      lat,
      lon,
      address: (data.address || "").trim().slice(0, 160),
      description: (data.description || "").trim().slice(0, 500),
      notes: (data.notes || "").trim().slice(0, 280),
      score: 0,
      votes: 0,
      logo: (data.logo || "").trim().slice(0, 500),
      socials: (data.socials || "").trim().slice(0, 800),
      hours: (data.hours || "").replace(/\s+/g, "").slice(0, 200),
      pays: (data.pays || "").trim().slice(0, 80),
      created: Date.now(),
      token: makePinToken(),
      verifiedAt: 0, // público recién cuando el scrape ve el código en la URL
    };
    const ok = await saveMapCsvText(stringifyMapCsv([...rows, row]));
    if (!ok) return { ok: false, error: "save" };
    return { ok: true, id: row.id, token: row.token };
  });

export const cancelMapListing = createServerFn({ method: "POST" })
  .validator((input: { id: string; token: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const token = (data.token || "").trim();
    if (!token || !data.id) return { ok: false, error: "token" };
    const gone = await deleteUnverifiedMapRow(data.id, token);
    if (gone === "live") return { ok: false, error: "live" };
    if (gone === "token") return { ok: false, error: "token" };
    return { ok: true };
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
    enqueuePendingPins(rows.filter((p) => !p.verified && p.proof && Date.now() - p.created < PIN_TTL_MS).map((p) => p.id));
    return rows
      .filter((p) => pinAlive(p))
      .slice(0, 48)
      .map((p) => ({ ...p, token: "" }));
  } catch {
    return [];
  }
});

export const submitCommunityPin = createServerFn({ method: "POST" })
  .validator((input: { name: string; blurb: string; proof?: string; links?: string[]; captchaId?: string; captcha?: string; captchaNonce?: string; hp?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; token?: string; id?: string; error?: string }> => {
    if (!consumeCaptchaTicket(data.captchaId || "", data.captcha || "", data.hp || "", data.captchaNonce || "")) return { ok: false, error: "captcha" };
    const name = data.name.trim().slice(0, 80);
    const blurb = data.blurb.trim().slice(0, 220);
    if (!name) return { ok: false, error: "need" };
    let proof = "";
    if ((data.proof || "").trim()) {
      const n = normalizeProofUrl(data.proof || "");
      if ("error" in n) return { ok: false, error: n.error };
      proof = safeHttp(n.url);
      if (!proof) return { ok: false, error: "need" };
    }
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
  .validator((input: { id: string; proof?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (tooMany(clientKey("pin-verify-burst"), 5, 5_000)) return { ok: false, error: "rate" };
    if (tooMany(clientKey("pin-verify"), 12, 60 * 60_000)) return { ok: false, error: "rate" };
    if (tooMany("pin-verify:global", 80, 60 * 60_000)) return { ok: false, error: "rate" };
    const rows = await loadPins();
    const pin = rows.find((p) => p.id === data.id);
    if (!pin) return { ok: false, error: "missing" };
    if ((data.proof || "").trim()) {
      const n = normalizeProofUrl(data.proof || "");
      if ("error" in n) return { ok: false, error: n.error };
      const proof = safeHttp(n.url);
      if (!proof) return { ok: false, error: "proof" };
      pin.proof = proof;
    }
    if (!pin.proof) return { ok: false, error: "need" };
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
  .validator((input: { id: string; token?: string; proof?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (tooMany(clientKey("map-verify-burst"), 5, 5_000)) return { ok: false, error: "rate" };
    if (tooMany(clientKey("map-verify"), 12, 60 * 60_000)) return { ok: false, error: "rate" };
    if (tooMany("map-verify:global", 80, 60 * 60_000)) return { ok: false, error: "rate" };
    const text = await loadMapCsvText();
    const rows = parseMapCsv(text);
    const row = rows.find((r) => r.id === data.id);
    const gate = cargaVerifyGate(row, data.token);
    if (gate !== "ok" || !row) return { ok: false, error: gate };
    const extra = socialsFromCsv(row.socials).map((l) => l.url).filter(Boolean);
    let proof = "";
    if ((data.proof || "").trim()) {
      const n = normalizeProofUrl(data.proof || "");
      if ("error" in n) return { ok: false, error: n.error };
      proof = safeHttp(n.url);
      if (!proof) return { ok: false, error: "proof" };
    }
    if (!proof) return { ok: false, error: "need" };
    const urls = [proof, ...extra.filter((u) => u !== proof)];
    const hit = await scrapeShowsToken(urls[0]!, row.token, urls.slice(1));
    if (!hit) return { ok: false, error: "proof" };
    if (proof) {
      const links = socialsFromCsv(row.socials);
      if (!links.some((l) => l.url === proof)) {
        links.push({ key: "web", label: "web", url: proof });
        row.socials = socialsToCsv(links);
      }
    }
    row.verifiedAt = Date.now();
    await saveMapCsvText(stringifyMapCsv(rows));
    return { ok: true };
  });

export const submitListingPatch = createServerFn({ method: "POST" })
  .validator((input: {
    listingId: string;
    name?: string;
    description?: string;
    address?: string;
    notes?: string;
    logo?: string;
    hours?: string;
    pays?: string;
    socials?: string;
    proof?: string;
    lat?: number;
    lon?: number;
    community?: boolean;
    captchaId?: string;
    captcha?: string;
    captchaNonce?: string;
    hp?: string;
  }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; token?: string; id?: string; error?: string }> => {
    if ((data.hp || "").trim()) return { ok: true };
    if (!consumeCaptchaTicket(data.captchaId || "", data.captcha || "", data.hp || "", data.captchaNonce || "")) {
      return { ok: false, error: "captcha" };
    }
    if (tooMany(clientKey("patch"), 6, 60 * 60_000)) return { ok: false, error: "rate" };
    if (tooMany("patch:global", 24, 60 * 60_000)) return { ok: false, error: "rate" };
    if ((await countPendingPatches()) >= 80) return { ok: false, error: "rate" };
    let proof = "";
    if ((data.proof || "").trim()) {
      const n = normalizeProofUrl(data.proof || "");
      if ("error" in n) return { ok: false, error: n.error };
      proof = safeHttp(n.url);
      if (!proof) return { ok: false, error: "links" };
    }
    const rows = parseMapCsv(await loadMapCsvText());
    const existing = rows.find((r) => r.id === data.listingId);
    const lat = Number(data.lat);
    const lon = Number(data.lon);
    const row = existing ?? {
      id: data.listingId.trim().slice(0, 80),
      tipo: data.community ? "community" as const : "shop" as const,
      name: (data.name || "").trim().slice(0, 80),
      lat,
      lon,
      address: (data.address || "").trim(),
      description: (data.description || "").trim(),
      notes: (data.notes || "").trim(),
      score: 0,
      votes: 0,
      logo: (data.logo || "").trim(),
      socials: "",
      hours: "",
      pays: "",
      created: Date.now(),
      token: "",
      verifiedAt: 0,
    };
    if (!row.id || !Number.isFinite(row.lat) || !Number.isFinite(row.lon)) return { ok: false, error: "need" };
    const made = proposeListingPatch(
      row,
      {
        name: data.name,
        description: data.description,
        address: data.address,
        notes: data.notes,
        logo: data.logo,
        hours: data.hours,
        pays: data.pays,
        socials: data.socials,
      },
      proof,
    );
    if (!made.ok) return { ok: false, error: made.error };
    await savePatch(made.patch);
    return { ok: true, token: made.patch.token, id: made.patch.id };
  });

export const verifyListingPatch = createServerFn({ method: "POST" })
  .validator((input: { id: string; token?: string; proof?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (tooMany(clientKey("patch-verify-burst"), 5, 5_000)) return { ok: false, error: "rate" };
    if (tooMany(clientKey("patch-verify"), 12, 60 * 60_000)) return { ok: false, error: "rate" };
    const patches = await loadPatches();
    const patch = patches.find((p) => p.id === data.id);
    if (!patch || !patchAlive(patch)) return { ok: false, error: "missing" };
    if (data.token && data.token !== patch.token) return { ok: false, error: "token" };
    if ((data.proof || "").trim()) {
      const n = normalizeProofUrl(data.proof || "");
      if ("error" in n) return { ok: false, error: n.error };
      const proof = safeHttp(n.url);
      if (!proof) return { ok: false, error: "proof" };
      patch.proof = proof;
    }
    if (!patch.proof) return { ok: false, error: "links" };
    const extra = socialsFromCsv(parseMapCsv(await loadMapCsvText()).find((r) => r.id === patch.listingId)?.socials || "")
      .map((l) => l.url)
      .filter(Boolean);
    const hit = await scrapeShowsToken(patch.proof, patch.token, extra);
    if (!hit) return { ok: false, error: "proof" };
    patch.verified = true;
    patch.verifiedAt = Date.now();
    await savePatch(patch);
    const rows = parseMapCsv(await loadMapCsvText());
    const next = applyListingPatch(rows, patch);
    await saveMapCsvText(stringifyMapCsv(next));
    clearGlobeStatsCache();
    return { ok: true };
  });

export const cancelListingPatch = createServerFn({ method: "POST" })
  .validator((input: { id: string; token: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const token = (data.token || "").trim();
    if (!token) return { ok: false, error: "token" };
    const patches = await loadPatches();
    const patch = patches.find((p) => p.id === data.id);
    if (!patch) return { ok: true };
    if (patch.verified) return { ok: false, error: "live" };
    if (patch.token !== token) return { ok: false, error: "token" };
    await replacePatches(patches.filter((p) => p.id !== data.id && Date.now() - p.created < 40 * PATCH_TTL_MS));
    return { ok: true };
  });

const contactHits = new Map<string, number>();

export const sendContact = createServerFn({ method: "POST" })
  .validator((input: {
    name: string;
    email: string;
    message: string;
    topic?: string;
    auto?: string;
    listingId?: string;
    hp?: string;
    captchaId?: string;
    captcha?: string;
    captchaNonce?: string;
  }) => input)
  .handler(async ({ data }): Promise<{
    ok: boolean;
    error?: string;
    relay?: string;
    ack?: string;
    subject?: string;
    activate?: boolean;
    ticket?: string;
  }> => {
    if ((data.hp || "").trim()) return { ok: true };
    if (!consumeCaptchaTicket(data.captchaId || "", data.captcha || "", data.hp || "", data.captchaNonce || "")) return { ok: false, error: "captcha" };
    const name = (data.name || "").trim().slice(0, 80);
    const email = (data.email || "").trim().toLowerCase().slice(0, 120);
    const message = (data.message || "").trim().slice(0, 2000);
    const topic = (data.topic || "general").slice(0, 24);
    const listingId = (data.listingId || "").trim().slice(0, 80);
    const ticket = makeContactTicket();
    const autoRaw = (data.auto || "").trim().slice(0, 2000);
    const auto = autoRaw.replaceAll("{ticket}", ticket).replaceAll("{listing}", listingId || "—");
    if (name.length < 2 || message.length < 2 || !email) return { ok: false, error: "need" };
    if (!MAIL_RE.test(email)) return { ok: false, error: "email" };
    if (!(await mailboxDomainOk(email))) return { ok: false, error: "email" };
    const now = Date.now();
    const stamp = contactHits.get(email) || 0;
    if (now - stamp < 12_000) return { ok: false, error: "rate" };
    if (tooMany(clientKey(`mail:${email}`), 5, 60 * 60_000)) return { ok: false, error: "rate" };
    await persistContact({ name, email, message, topic, auto, ticket, listingId });
    saveContactTicket({ id: ticket, topic, listingId, name, email, message, created: now });
    contactHits.set(email, now);
    const payload = { name, email, message, topic, auto, ticket, listingId };
    const [sent, ack] = await Promise.all([forwardFormSubmit(payload), forwardAck(payload)]);
    const relay = contactRelay();
    const ackUrl = ackRelay(email).url;
    const activate = sent === "activate" || ack === "activate";
    if (sent === "ok" && ack === "ok") return { ok: true, subject: `${relay.subject} · ${topic} · ${ticket}`, activate, ticket };
    return {
      ok: true,
      relay: sent === "ok" ? undefined : relay.url,
      ack: ack === "ok" ? undefined : ackUrl,
      subject: `${relay.subject} · ${topic} · ${ticket}`,
      activate,
      ticket,
    };
  });
