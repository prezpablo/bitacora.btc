import { homeLookback, liquidityScore } from "@/domain";
import type {
  ChartRange,
  ClarityPayload,
  EtfFlowPayload,
  FearGreedPayload,
  LiquidityPayload,
  OnchainPayload,
  PulsePayload,
  SeriesPoint,
} from "@/domain/entities";

const DAY = 86_400_000;
const LOOKBACK: Record<ChartRange, number> = {
  "1d": homeLookback("1d"),
  "1w": homeLookback("1w"),
  "1m": homeLookback("1m"),
  "6m": homeLookback("6m"),
};

const CLARITY_SLUG = "clarity-act-signed-into-law-in-2026";
const YES_TOKEN =
  "35198549486569600595408965368290795524428922595732253580266052028158040373233";

function parseField<T>(v: unknown, fallback: T): T {
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return (v as T) ?? fallback;
}

function deltaPct(series: SeriesPoint[]): number | null {
  const a = series[0]?.v;
  const b = series[series.length - 1]?.v;
  if (a == null || b == null || a === 0) return null;
  return ((b - a) / a) * 100;
}

function sliceSeries(series: SeriesPoint[], from: number): SeriesPoint[] {
  const cut = series.filter((p) => p.t >= from);
  return cut.length >= 2 ? cut : series.slice(-8);
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const u = url.includes("?") ? `${url}&_=${Date.now()}` : `${url}?_=${Date.now()}`;
  const res = await fetch(u, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as T;
}

async function fetchChart(name: string, signal: AbortSignal): Promise<SeriesPoint[]> {
  const url = `https://api.blockchain.info/charts/${name}?timespan=180days&format=json&sampled=true`;
  const j = await fetchJson<{ values?: { x: number; y: number }[] }>(url, signal);
  return (j.values ?? []).map((p) => ({ t: p.x * 1000, v: p.y }));
}

const MEMPOOL_APIS = ["https://mempool.space/api", "https://mempool.emzy.de/api"] as const;

async function fetchMempoolJson<T>(path: string, parent: AbortSignal): Promise<T> {
  let last: unknown;
  for (const base of MEMPOOL_APIS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4_500);
    const onAbort = () => ctrl.abort();
    if (parent.aborted) ctrl.abort();
    else parent.addEventListener("abort", onAbort, { once: true });
    try {
      return await fetchJson<T>(`${base}${path}`, ctrl.signal);
    } catch (e) {
      last = e;
    } finally {
      clearTimeout(timer);
      parent.removeEventListener("abort", onAbort);
    }
  }
  throw last instanceof Error ? last : new Error("mempool down");
}

async function fetchOnchainFallback(signal: AbortSignal): Promise<Partial<OnchainPayload>> {
  const [heightRaw, hashRaw, diffRaw, unconf, fees] = await Promise.all([
    fetchJson<number>("https://blockstream.info/api/blocks/tip/height", signal).catch(() =>
      fetchJson<number>("https://api.blockchain.info/q/getblockcount", signal).catch(() => 0),
    ),
    fetchJson<number>("https://api.blockchain.info/q/hashrate", signal).catch(() => 0),
    fetchJson<number>("https://blockchain.info/q/getdifficulty", signal).catch(() => 0),
    fetchJson<number>("https://blockchain.info/q/unconfirmedcount", signal).catch(() => undefined),
    fetchJson<Record<string, number>>("https://blockstream.info/api/fee-estimates", signal).catch(
      () => ({}) as Record<string, number>,
    ),
  ]);
  const feeFast = fees["1"] ?? fees["2"];
  const feeHour = fees["6"] ?? fees["10"];
  return {
    height: Number(heightRaw) || 0,
    hashrateEh: Number(hashRaw) > 0 ? Number(hashRaw) / 1e9 : undefined,
    difficulty: Number(diffRaw) || undefined,
    feeFast: feeFast != null ? Math.round(feeFast) : undefined,
    feeHour: feeHour != null ? Math.round(feeHour) : undefined,
    mempoolTx: unconf,
    asOf: Date.now(),
  };
}

export async function fetchOnchainLive(signal?: AbortSignal): Promise<Partial<OnchainPayload>> {
  const ctrl = signal ?? new AbortController().signal;
  try {
    const [fees, pool, heightRaw, mining, adj] = await Promise.all([
      fetchMempoolJson<{ fastestFee?: number; hourFee?: number }>("/v1/fees/recommended", ctrl),
      fetchMempoolJson<{ count?: number; vsize?: number }>("/mempool", ctrl),
      fetchMempoolJson<number>("/blocks/tip/height", ctrl),
      fetchMempoolJson<{ currentHashrate?: number; currentDifficulty?: number }>(
        "/v1/mining/hashrate/3d",
        ctrl,
      ),
      fetchMempoolJson<{
        difficultyChange?: number;
        remainingBlocks?: number;
        progressPercent?: number;
      }>("/v1/difficulty-adjustment", ctrl),
    ]);
    const hashEh = mining.currentHashrate ? mining.currentHashrate / 1e18 : undefined;
    return {
      height: Number(heightRaw) || 0,
      hashrateEh: hashEh,
      difficulty: mining.currentDifficulty,
      feeFast: fees.fastestFee,
      feeHour: fees.hourFee,
      mempoolTx: pool.count,
      mempoolVsize: pool.vsize,
      diffAdjPct: adj.difficultyChange,
      blocksToAdj: adj.remainingBlocks,
      adjProgress: adj.progressPercent,
      asOf: Date.now(),
    };
  } catch {
    return await fetchOnchainFallback(ctrl);
  }
}


export async function fetchOnchain(range: ChartRange): Promise<OnchainPayload> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const [hash, diff, tx, live] = await Promise.all([
      fetchChart("hash-rate", ctrl.signal),
      fetchChart("difficulty", ctrl.signal),
      fetchChart("n-transactions", ctrl.signal),
      fetchOnchainLive(ctrl.signal).catch(() => ({}) as Partial<OnchainPayload>),
    ]);
    const from = Date.now() - LOOKBACK[range];
    const hashW = sliceSeries(hash, from);
    const diffW = sliceSeries(diff, from);
    const txW = sliceSeries(tx, from);
    const lastHash = hashW[hashW.length - 1]?.v ?? hash[hash.length - 1]?.v ?? 0;
    const lastDiff = diffW[diffW.length - 1]?.v ?? diff[diff.length - 1]?.v ?? 0;
    const lastTx = txW[txW.length - 1]?.v ?? tx[tx.length - 1]?.v ?? 0;
    return {
      height: live.height || 0,
      hashrateEh: live.hashrateEh ?? lastHash / 1e6,
      hashrateDelta: deltaPct(hashW),
      difficulty: live.difficulty ?? lastDiff,
      difficultyDelta: deltaPct(diffW),
      txPerDay: lastTx,
      txDelta: deltaPct(txW),
      hashSeries: hashW,
      txSeries: txW,
      asOf: Date.now(),
      feeFast: live.feeFast,
      feeHour: live.feeHour,
      mempoolTx: live.mempoolTx,
      mempoolVsize: live.mempoolVsize,
      diffAdjPct: live.diffAdjPct,
      blocksToAdj: live.blocksToAdj,
      adjProgress: live.adjProgress,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchClarity(): Promise<ClarityPayload> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const [markets, hist] = await Promise.all([
      fetchJson<Record<string, unknown>[]>(
        `https://gamma-api.polymarket.com/markets?slug=${CLARITY_SLUG}`,
        ctrl.signal,
      ),
      fetchJson<{ history?: { t: number; p: number }[] }>(
        `https://clob.polymarket.com/prices-history?market=${YES_TOKEN}&interval=1w&fidelity=60`,
        ctrl.signal,
      ).catch(() => ({ history: [] as { t: number; p: number }[] })),
    ]);
    const m = markets[0];
    if (!m) throw new Error("clarity market missing");
    const prices = parseField<string[]>(m.outcomePrices, ["0", "1"]);
    const yes = Number(prices[0] ?? 0);
    const no = Number(prices[1] ?? 1 - yes);
    const end = Date.parse(String(m.endDate ?? "2027-01-01")) || Date.UTC(2027, 0, 1);
    const history = (hist.history ?? []).map((p) => ({ t: p.t * 1000, v: p.p }));
    return {
      question: String(m.question ?? "Clarity Act firmada en 2026?"),
      slug: CLARITY_SLUG,
      yes,
      no,
      volume: Number(m.volumeNum ?? m.volume ?? 0),
      volume24h: Number(m.volume24hr ?? 0),
      endDate: end,
      history,
      url: `https://polymarket.com/event/${CLARITY_SLUG}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFearGreed(): Promise<FearGreedPayload> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const j = await fetchJson<{
      data?: { value: string; value_classification: string; timestamp: string }[];
    }>("https://api.alternative.me/fng/?limit=30", ctrl.signal);
    const rows = j.data ?? [];
    if (rows.length < 1) throw new Error("fng empty");
    const latest = rows[0]!;
    const history = [...rows].reverse().map((r) => ({
      t: Number(r.timestamp) * 1000,
      v: Number(r.value),
    }));
    return {
      value: Number(latest.value),
      classification: latest.value_classification,
      asOf: Number(latest.timestamp) * 1000,
      history,
      url: "https://alternative.me/crypto/fear-and-greed-index/",
    };
  } finally {
    clearTimeout(timer);
  }
}

const OKX = "https://www.okx.com/api/v5";
const CT_VAL = 0.01;

type OkxRes<T> = { code: string; data: T; msg: string };

function bandDepth(levels: string[][], mid: number, side: "bid" | "ask", pct: number) {
  const lo = side === "bid" ? mid * (1 - pct) : 0;
  const hi = side === "ask" ? mid * (1 + pct) : Infinity;
  let usd = 0;
  for (const row of levels) {
    const px = Number(row[0]);
    const sz = Number(row[1]);
    if (!(px > 0) || !(sz > 0)) continue;
    if (side === "bid" && px < lo) break;
    if (side === "ask" && px > hi) break;
    usd += sz * CT_VAL * px;
  }
  return usd;
}

export async function fetchLiquidity(): Promise<LiquidityPayload> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  const s = ctrl.signal;
  try {
    const [bookJ, tickJ, oiJ, markJ, idxJ, fundJ, fundH, oiH] = await Promise.all([
      fetchJson<OkxRes<{ bids: string[][]; asks: string[][]; ts: string }[]>>(
        `${OKX}/market/books?instId=BTC-USDT-SWAP&sz=400`,
        s,
      ),
      fetchJson<OkxRes<Record<string, string>[]>>(
        `${OKX}/market/ticker?instId=BTC-USDT-SWAP`,
        s,
      ),
      fetchJson<OkxRes<{ oiUsd: string; ts: string }[]>>(
        `${OKX}/public/open-interest?instId=BTC-USDT-SWAP`,
        s,
      ),
      fetchJson<OkxRes<{ markPx: string }[]>>(
        `${OKX}/public/mark-price?instId=BTC-USDT-SWAP`,
        s,
      ),
      fetchJson<OkxRes<{ idxPx: string }[]>>(
        `${OKX}/market/index-tickers?quoteCcy=USDT&instId=BTC-USDT`,
        s,
      ),
      fetchJson<OkxRes<{ fundingRate: string; nextFundingTime: string; premium: string }[]>>(
        `${OKX}/public/funding-rate?instId=BTC-USDT-SWAP`,
        s,
      ),
      fetchJson<OkxRes<{ fundingTime: string; realizedRate: string; fundingRate: string }[]>>(
        `${OKX}/public/funding-rate-history?instId=BTC-USDT-SWAP&limit=14`,
        s,
      ),
      fetchJson<OkxRes<string[][]>>(
        `${OKX}/rubik/stat/contracts/open-interest-history?instId=BTC-USDT-SWAP&period=1H`,
        s,
      ),
    ]);

    const book = bookJ.data[0];
    const tick = tickJ.data[0];
    const oiRow = oiJ.data[0];
    const mark = Number(markJ.data[0]?.markPx ?? tick?.last ?? 0);
    const index = Number(idxJ.data[0]?.idxPx ?? mark);
    const fund = fundJ.data[0];
    if (!book || !tick || !oiRow || !(mark > 0)) throw new Error("okx liq empty");

    const bidPx = Number(tick.bidPx);
    const askPx = Number(tick.askPx);
    const mid = bidPx > 0 && askPx > 0 ? (bidPx + askPx) / 2 : mark;
    const spreadBps = mid > 0 ? ((askPx - bidPx) / mid) * 10_000 : 0;

    const depth1m = {
      bid: bandDepth(book.bids, mid, "bid", 0.01),
      ask: bandDepth(book.asks, mid, "ask", 0.01),
    };
    const depth2m = {
      bid: bandDepth(book.bids, mid, "bid", 0.02),
      ask: bandDepth(book.asks, mid, "ask", 0.02),
    };
    const tot1 = depth1m.bid + depth1m.ask;
    const lastBid = Number(book.bids[book.bids.length - 1]?.[0] ?? bidPx);
    const lastAsk = Number(book.asks[book.asks.length - 1]?.[0] ?? askPx);
    const coverBps =
      mid > 0
        ? Math.max(((mid - lastBid) / mid) * 10_000, ((lastAsk - mid) / mid) * 10_000)
        : 0;
    const imbalance = tot1 > 0 ? depth1m.bid / tot1 : 0.5;
    const openInterestUsd = Number(oiRow.oiUsd);
    const volume24h = Number(tick.volCcy24h) * mark;
    const basisBps = index > 0 ? ((mark - index) / index) * 10_000 : 0;
    const funding = Number(fund.fundingRate);

    const oiSeries: SeriesPoint[] = (oiH.data ?? [])
      .map((row) => ({ t: Number(row[0]), v: Number(row[3]) }))
      .filter((p) => p.t > 0 && p.v > 0)
      .slice(-24);
    const oiDelta = deltaPct(oiSeries);

    const fundingSeries: SeriesPoint[] = [...(fundH.data ?? [])]
      .reverse()
      .map((r) => ({
        t: Number(r.fundingTime),
        v: Number(r.realizedRate || r.fundingRate) * 100,
      }))
      .filter((p) => p.t > 0);

    const score = liquidityScore({
      spreadBps,
      depthUsd: tot1,
      imbalance,
    });

    return {
      source: "okx",
      asOf: Number(book.ts) || Date.now(),
      price: mark,
      spreadBps,
      depth1m,
      depth2m,
      coverBps,
      imbalance,
      openInterestUsd,
      oiDelta,
      oiSeries,
      funding,
      fundingSeries,
      nextFundingAt: Number(fund.nextFundingTime) || null,
      basisBps,
      volume24h,
      score,
    };
  } finally {
    clearTimeout(timer);
  }
}

type CcNews = {
  Data?: {
    id: string;
    title: string;
    url: string;
    source: string;
    body?: string;
    published_on: number;
    categories?: string;
    source_info?: { name?: string };
  }[];
};

type CgTrend = {
  coins?: {
    item?: {
      id?: string;
      name?: string;
      symbol?: string;
      market_cap_rank?: number;
      data?: { price_change_percentage_24h?: { usd?: number } };
    };
  }[];
};

const TAG_ES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  TRADING: "Mercado",
  MARKET: "Mercado",
  REGULATION: "Regulación",
  BLOCKCHAIN: "Cadena",
  MINING: "Minería",
  WALLET: "Wallet",
  EXCHANGE: "Exchange",
  NFT: "NFT",
  DEFI: "DeFi",
  ICO: "Emisión",
  SPONSORED: "Nota",
  PROTOCOLO: "Protocolo",
};

function newsTag(raw?: string) {
  const first = (raw ?? "BTC").split("|")[0]?.trim().toUpperCase() || "BTC";
  return TAG_ES[first] ?? first.slice(0, 12);
}

const RSS_FEEDS: { url: string; source: string; tag: string; all: boolean }[] = [
  { url: "https://bitcoinmagazine.com/feed", source: "Bitcoin Magazine", tag: "Bitcoin", all: true },
  { url: "https://bitcoinops.org/feed.xml", source: "Optech", tag: "Protocolo", all: true },
  {
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
    source: "CoinDesk",
    tag: "Mercado",
    all: false,
  },
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph", tag: "Mercado", all: false },
  { url: "https://cryptoslate.com/feed/", source: "CryptoSlate", tag: "Mercado", all: false },
];

const BTC_RE =
  /\b(bitcoin|btc|etf|sec|clarity|mineri[aa]|mining|miner|halving|lightning|on-?chain|spot btc|sats?|hashrate|difficulty|fed|fomc|stablecoin|rwa|tokeniz)\b/i;

function decodeXml(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/'/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function clipText(s: string, n = 280) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n).replace(/\s+\S*$/, "")}…`;
}

function xmlField(block: string, name: string) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decodeXml(m[1]!) : "";
}

function rssSummary(block: string) {
  const raw =
    xmlField(block, "description") ||
    xmlField(block, "summary") ||
    xmlField(block, "content:encoded") ||
    xmlField(block, "content");
  return clipText(raw);
}

function parseRss(xml: string, source: string, tag: string) {
  const chunks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const out: NewsRow[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const block = chunks[i]!;
    const title = xmlField(block, "title");
    const url = xmlLink(block) || xmlField(block, "guid") || xmlField(block, "id");
    if (!title || !url.startsWith("http")) continue;
    const pub = xmlField(block, "pubDate") || xmlField(block, "published") || xmlField(block, "updated");
    const published = pub ? Date.parse(pub) : 0;
    out.push({
      id: `rss:${source}:${url}`,
      title,
      summary: rssSummary(block),
      source,
      url,
      published: Number.isFinite(published) ? published : 0,
      tag,
    });
  }
  return out;
}

function xmlLink(block: string) {
  const href = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (href?.[1]) return href[1];
  const t = xmlField(block, "link");
  return t.startsWith("http") ? t : "";
}

async function fetchText(url: string, signal: AbortSignal, etag?: string) {
  const headers: Record<string, string> = {
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    "User-Agent": "bitacora.btc/1.0",
  };
  if (etag) headers["If-None-Match"] = etag;
  const res = await fetch(url, { signal, cache: "no-store", headers });
  if (res.status === 304) return { xml: "", etag, notModified: true as const };
  if (!res.ok) throw new Error(`${res.status}`);
  return {
    xml: await res.text(),
    etag: res.headers.get("etag") ?? etag,
    notModified: false as const,
  };
}

type NewsRow = {
  id: string;
  title: string;
  summary?: string;
  source: string;
  url: string;
  published: number;
  tag: string;
};

const RSS_TTL = 10 * 60_000;
const RSS_STALE = 30 * 60_000;
const rssCache = new Map<
  string,
  { at: number; rows: NewsRow[]; etag?: string; inflight?: Promise<NewsRow[]> }
>();

async function loadRssFeed(
  feed: (typeof RSS_FEEDS)[number],
  parent: AbortSignal,
): Promise<NewsRow[]> {
  const now = Date.now();
  const hit = rssCache.get(feed.url);
  if (hit && now - hit.at < RSS_TTL) return hit.rows;
  if (hit?.inflight) return hit.inflight;

  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (parent.aborted) ctrl.abort();
  else parent.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(), 6_000);

  const job = (async () => {
    try {
      const res = await fetchText(feed.url, ctrl.signal, hit?.etag);
      if (res.notModified && hit) {
        const fresh = { ...hit, at: Date.now(), inflight: undefined };
        rssCache.set(feed.url, fresh);
        return fresh.rows;
      }
      const parsed = parseRss(res.xml, feed.source, feed.tag);
      const rows = feed.all ? parsed : parsed.filter((n) => BTC_RE.test(n.title));
      const keep = rows.length ? rows : hit?.rows ?? [];
      rssCache.set(feed.url, { at: Date.now(), rows: keep, etag: res.etag });
      return keep;
    } catch {
      if (hit && now - hit.at < RSS_STALE) return hit.rows;
      return hit?.rows ?? [];
    } finally {
      clearTimeout(timer);
      parent.removeEventListener("abort", onAbort);
      const cur = rssCache.get(feed.url);
      if (cur) cur.inflight = undefined;
    }
  })();

  rssCache.set(feed.url, {
    at: hit?.at ?? 0,
    rows: hit?.rows ?? [],
    etag: hit?.etag,
    inflight: job,
  });
  return job;
}

async function fetchRssNews(signal: AbortSignal) {
  const batches = await Promise.all(RSS_FEEDS.map((feed) => loadRssFeed(feed, signal)));
  return batches.flat();
}

function normTitle(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9áéíóúñ ]+/gi, " ").replace(/\s+/g, " ").trim();
}

function mergeNews(...lists: NewsRow[][]) {
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  const out: NewsRow[] = [];
  const flat = lists.flat().sort((a, b) => b.published - a.published);
  for (const n of flat) {
    const u = n.url.split("?")[0]!.replace(/\/+$/, "");
    const t = normTitle(n.title).slice(0, 80);
    if (seenUrl.has(u) || (t && seenTitle.has(t))) continue;
    seenUrl.add(u);
    if (t) seenTitle.add(t);
    out.push(n);
  }
  return out;
}

const CC_TTL = 5 * 60_000;
let ccCache: { at: number; rows: NewsRow[]; inflight?: Promise<NewsRow[]> } | null = null;

async function fetchNews(signal: AbortSignal) {
  const now = Date.now();
  if (ccCache && now - ccCache.at < CC_TTL) return ccCache.rows;
  if (ccCache?.inflight) return ccCache.inflight;
  const job = (async () => {
    const tryLang = async (lang: string) => {
      const j = await fetchJson<CcNews>(
        `https://min-api.cryptocompare.com/data/v2/news/?lang=${lang}&categories=BTC,Regulation,Mining,Blockchain&excludeCategories=Sponsored`,
        signal,
      );
      return (j.Data ?? [])
        .filter((row) => row.title && row.url)
        .map((row) => ({
          id: String(row.id),
          title: row.title.trim(),
          summary: clipText(decodeXml(row.body ?? "")),
          source: row.source_info?.name || row.source || "CryptoCompare",
          url: row.url,
          published: (row.published_on || 0) * 1000,
          tag: newsTag(row.categories),
        }));
    };
    try {
      const es = await tryLang("ES").catch(() => []);
      const rows =
        es.length >= 4
          ? es
          : [...es, ...(await tryLang("EN").catch(() => [])).filter((n) => !es.some((x) => x.id === n.id))];
      if (rows.length) ccCache = { at: Date.now(), rows };
      return rows.length ? rows : (ccCache?.rows ?? []);
    } catch {
      return ccCache?.rows ?? [];
    } finally {
      if (ccCache) ccCache.inflight = undefined;
    }
  })();
  ccCache = { at: ccCache?.at ?? 0, rows: ccCache?.rows ?? [], inflight: job };
  return job;
}

const CG_TTL = 4 * 60_000;
let cgCache: { at: number; rows: PulsePayload["trends"]; inflight?: Promise<PulsePayload["trends"]> } | null =
  null;

async function fetchTrends(signal: AbortSignal) {
  const now = Date.now();
  if (cgCache && now - cgCache.at < CG_TTL) return cgCache.rows;
  if (cgCache?.inflight) return cgCache.inflight;
  const job = (async () => {
    try {
      const j = await fetchJson<CgTrend>("https://api.coingecko.com/api/v3/search/trending", signal);
      const rows = (j.coins ?? [])
        .map((row) => row.item)
        .filter((item): item is NonNullable<typeof item> => Boolean(item?.name && item.symbol))
        .map((item) => ({
          id: item.id || item.symbol!,
          name: item.name!,
          symbol: item.symbol!.toUpperCase(),
          rank: item.market_cap_rank ?? null,
          change24h: item.data?.price_change_percentage_24h?.usd ?? null,
        }));
      if (rows.length) cgCache = { at: Date.now(), rows };
      return rows.length ? rows : (cgCache?.rows ?? []);
    } catch {
      return cgCache?.rows ?? [];
    } finally {
      if (cgCache) cgCache.inflight = undefined;
    }
  })();
  cgCache = { at: cgCache?.at ?? 0, rows: cgCache?.rows ?? [], inflight: job };
  return job;
}

const PULSE_TTL = 90_000;
const PULSE_STALE = 8 * 60_000;
let pulseCache: { at: number; data: PulsePayload; inflight?: Promise<PulsePayload> } | null = null;

async function buildPulse(): Promise<PulsePayload> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const [rss, cc, trends] = await Promise.all([
      fetchRssNews(ctrl.signal),
      fetchNews(ctrl.signal),
      fetchTrends(ctrl.signal),
    ]);
    const news = mergeNews(rss, cc);
    if (!news.length && !trends.length) throw new Error("pulse empty");
    return {
      news: news.slice(0, 14),
      trends: trends.slice(0, 8),
      asOf: Date.now(),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRawPulse(): Promise<PulsePayload> {
  const now = Date.now();
  if (pulseCache && now - pulseCache.at < PULSE_TTL) return pulseCache.data;
  if (pulseCache?.inflight) return pulseCache.inflight;

  const job = buildPulse()
    .then((data) => {
      pulseCache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      if (pulseCache) pulseCache.inflight = undefined;
    });

  if (pulseCache && now - pulseCache.at < PULSE_STALE) {
    pulseCache.inflight = job;
    return pulseCache.data;
  }

  pulseCache = { at: pulseCache?.at ?? 0, data: pulseCache?.data ?? { news: [], trends: [], asOf: 0 }, inflight: job };
  return job;
}

export async function fetchPulse(_lang?: string): Promise<PulsePayload> {
  return fetchRawPulse();
}

const ETF_URL = "https://bitbo.io/treasuries/etf-flows/";
let etfCache: { at: number; data: EtfFlowPayload } | null = null;

function numCell(raw: string) {
  const n = Number(String(raw).replace(/,/g, "").replace(/[()]/g, (c) => (c === "(" ? "-" : "")));
  return Number.isFinite(n) ? n : 0;
}

function parseEtfTable(html: string): { date: string; t: number; usdM: number; funds: { ticker: string; usdM: number }[] }[] {
  const tables = html.match(/<table[\s\S]*?<\/table>/i);
  if (!tables) return [];
  const table = tables[0]!;
  const rows: string[][] = [];
  for (const tr of table.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const cells = [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    );
    if (cells.length) rows.push(cells);
  }
  if (rows.length < 2) return [];
  const head = rows[0]!.map((h) => h.toUpperCase());
  const totalIdx = head.findIndex((h) => h === "TOTALS" || h === "TOTAL");
  const skip = new Set(["DATE", "TOTALS", "TOTAL"]);
  const out: { date: string; t: number; usdM: number; funds: { ticker: string; usdM: number }[] }[] = [];
  for (const cells of rows.slice(1)) {
    const date = cells[0] || "";
    if (!/^[A-Za-z]{3} /.test(date)) continue;
    const t = Date.parse(date + " UTC");
    if (!Number.isFinite(t)) continue;
    const usdM = totalIdx >= 0 ? numCell(cells[totalIdx] || "0") : numCell(cells[cells.length - 1] || "0");
    const funds = head
      .map((ticker, i) => ({ ticker, usdM: numCell(cells[i] || "0") }))
      .filter((f) => !skip.has(f.ticker) && f.ticker.length <= 5);
    out.push({ date, t, usdM, funds });
  }
  return out;
}

function parseEtfJsHistory(html: string, kind: "Btc" | "Usd"): SeriesPoint[] {
  const start = html.indexOf(`const history${kind} = [`);
  if (start < 0) return [];
  const end = html.indexOf(`mergedHistory${kind}`, start);
  const chunk = html.slice(start, end > start ? end : start + 120_000);
  const pairs = [...chunk.matchAll(/getPreviousBusinessDay\((\d+)\),\s*truncate\(([-\d.]+)/g)];
  return pairs.map((m) => ({ t: Number(m[1]), v: Number(m[2]) })).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v));
}

export async function fetchEtfFlows(): Promise<EtfFlowPayload> {
  const now = Date.now();
  if (etfCache && now - etfCache.at < 15 * 60_000) return etfCache.data;
  const res = await fetch(ETF_URL, {
    cache: "no-store",
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0 (compatible; bitacora.btc/1.0)",
    },
  });
  if (!res.ok) throw new Error(`etf ${res.status}`);
  const html = await res.text();
  const days = parseEtfTable(html);
  const usdHist = parseEtfJsHistory(html, "Usd");
  const btcHist = parseEtfJsHistory(html, "Btc");
  if (!days.length && !usdHist.length && !btcHist.length) throw new Error("etf empty");
  const last = days[0];
  const lastUsdFromTable = last?.usdM ?? 0;
  const lastBtcRaw = btcHist.length ? btcHist[btcHist.length - 1]!.v : null;
  let series: SeriesPoint[] = usdHist.length ? usdHist : [];
  if (series.length) {
    const lastH = series[series.length - 1]!.v;
    if (last && Math.abs(lastH) > 1 && Math.abs(lastUsdFromTable) > 1) {
      const ratio = Math.abs(lastH / lastUsdFromTable);
      if (ratio > 8 || ratio < 0.12) {
        series = series.map((p) => ({ t: p.t, v: p.v / (lastH / lastUsdFromTable) }));
      }
    }
  } else if (days.length) {
    series = days.slice().reverse().map((d) => ({ t: d.t, v: d.usdM }));
  } else if (btcHist.length && lastBtcRaw && lastUsdFromTable) {
    const px = lastUsdFromTable / lastBtcRaw;
    series = btcHist.map((p) => ({ t: p.t, v: p.v * px }));
  }
  const lastUsdM = last?.usdM ?? series[series.length - 1]?.v ?? 0;
  const lastDate =
    last?.date ||
    (series.length ? new Date(series[series.length - 1]!.t).toISOString().slice(0, 10) : "—");
  const lastT = series[series.length - 1]?.t ?? Date.now();
  const weekUsdM = series.filter((p) => p.t >= lastT - 7 * 86_400_000).reduce((s, p) => s + p.v, 0);
  const monthUsdM = series.filter((p) => p.t >= lastT - 30 * 86_400_000).reduce((s, p) => s + p.v, 0);
  const data: EtfFlowPayload = {
    asOf: Date.now(),
    source: "Bitbo",
    url: ETF_URL,
    lastDate,
    lastUsdM,
    lastBtc: lastBtcRaw,
    weekUsdM,
    monthUsdM,
    series,
    funds: last ? last.funds.filter((f) => f.usdM !== 0).sort((a, b) => Math.abs(b.usdM) - Math.abs(a.usdM)) : [],
  };
  etfCache = { at: Date.now(), data };
  return data;
}