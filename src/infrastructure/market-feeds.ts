import { DAY_MS, RANGE_SPEC, hydrateCloses, resampleToTf, stitchCandles, type Candle, type ChartRange } from "@/domain";
import type { LiveTape, MarketFeed } from "@/application";
import { fetchBinanceSpot, fetchJson } from "./http";
import { fetchBinanceTf, fetchOkxTf } from "./klines";

const HL_INFO = "https://api.hyperliquid.xyz/info";

let deepDailyCache: { at: number; candles: Candle[] } | null = null;

async function hlInfo<T>(body: unknown, signal: AbortSignal): Promise<T> {
  const res = await fetch(HL_INFO, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`hl ${res.status}`);
  return (await res.json()) as T;
}

async function fetchHlCandles(interval: string, startTime: number, signal: AbortSignal) {
  const json = await hlInfo<{ t: number; o: string; h: string; l: string; c: string; v: string }[]>(
    { type: "candleSnapshot", req: { coin: "BTC", interval, startTime, endTime: Date.now() } },
    signal,
  );
  if (!Array.isArray(json) || json.length < 24) throw new Error("hl candles short");
  const rows = json
    .map((c) => ({
      t: Number(c.t),
      open: Number(c.o),
      high: Number(c.h),
      low: Number(c.l),
      close: Number(c.c),
      volume: Number(c.v),
    }))
    .filter((c) => c.t > 0 && c.close > 0)
    .sort((a, b) => a.t - b.t);
  if (rows.length < 24) throw new Error("hl candles short");
  return rows;
}

async function fetchHlCtx(signal: AbortSignal) {
  const [meta, ctxs] = await hlInfo<
    [{ universe: { name: string }[] }, { markPx: string; prevDayPx: string; dayNtlVlm: string; openInterest: string }[]]
  >({ type: "metaAndAssetCtxs" }, signal);
  const idx = meta.universe.findIndex((u) => u.name === "BTC");
  if (idx < 0) throw new Error("hl no BTC");
  const ctx = ctxs[idx]!;
  const price = Number(ctx.markPx);
  const prev = Number(ctx.prevDayPx);
  return {
    price,
    change24h: prev > 0 ? ((price - prev) / prev) * 100 : 0,
    volume24h: Number(ctx.dayNtlVlm),
  };
}

function parseKline(row: unknown[]): Candle {
  return {
    t: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
  };
}

async function _fetchKlines(interval: string, limit: number, signal: AbortSignal, startTime?: number) {
  const cap = Math.min(1000, Math.max(limit, 24));
  let path = `/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${cap}`;
  if (startTime != null) path += `&startTime=${startTime}`;
  const json = await fetchBinanceSpot<unknown[]>(path, signal);
  const rows = json.map((row) => parseKline(row as unknown[])).filter((c) => c.t > 0 && c.close > 0);
  if (rows.length < 24) throw new Error("bn klines short");
  return rows;
}

async function fetchTicker(signal: AbortSignal) {
  const j = await fetchBinanceSpot<{
    lastPrice: string;
    priceChangePercent: string;
    highPrice: string;
    lowPrice: string;
    quoteVolume: string;
  }>("/api/v3/ticker/24hr?symbol=BTCUSDT", signal);
  return {
    price: Number(j.lastPrice),
    change24h: Number(j.priceChangePercent),
    high24h: Number(j.highPrice),
    low24h: Number(j.lowPrice),
    volume24h: Number(j.quoteVolume),
  };
}

async function fetchLongShort(signal: AbortSignal) {
  const j = await fetchJson<{ longAccount: string; shortAccount: string }[]>(
    "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1",
    signal,
  );
  const row = j[0];
  if (!row) throw new Error("ls empty");
  return {
    longPct: Number(row.longAccount) * 100,
    shortPct: Number(row.shortAccount) * 100,
  };
}

async function fetchBlockchainCloses(signal: AbortSignal) {
  const j = await fetchJson<{ values?: { x: number; y: number }[] }>(
    "https://api.blockchain.info/charts/market-price?timespan=all&format=json&sampled=false",
    signal,
  );
  return (j.values ?? []).filter((p) => p.y > 0).map((p) => ({ t: p.x * 1000, close: p.y }));
}

async function fetchYahooDaily(signal: AbortSignal): Promise<Candle[]> {
  const period1 = 1_412_121_600;
  const period2 = Math.floor(Date.now() / 1000) + 86_400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?period1=${period1}&period2=${period2}&interval=1d&includePrePost=false`;
  const j = await fetchJson<{
    chart?: {
      result?: {
        timestamp?: number[];
        indicators?: {
          quote?: {
            open?: (number | null)[];
            high?: (number | null)[];
            low?: (number | null)[];
            close?: (number | null)[];
            volume?: (number | null)[];
          }[];
        };
      }[];
    };
  }>(url, signal, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; bitacora.btc/1.0; +https://bitcoin.org)",
    },
  });
  const result = j.chart?.result?.[0];
  const ts = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0];
  if (!q || ts.length < 30) throw new Error("yahoo short");
  const candles: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const open = q.open?.[i];
    const high = q.high?.[i];
    const low = q.low?.[i];
    const close = q.close?.[i];
    const volume = q.volume?.[i];
    if (!(open && high && low && close) || open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;
    candles.push({
      t: ts[i]! * 1000,
      open,
      high,
      low,
      close,
      volume: volume && volume > 0 ? volume : 0,
    });
  }
  if (candles.length < 30) throw new Error("yahoo short");
  return candles;
}

async function fetchCoinbaseDaily(signal: AbortSignal): Promise<Candle[]> {
  const startMs = Date.UTC(2015, 6, 20);
  const endMs = Date.now();
  const step = 280 * DAY_MS;
  const chunks: Promise<Candle[]>[] = [];
  for (let a = startMs; a < endMs; a += step) {
    const b = Math.min(a + step - 1, endMs);
    const url = `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400&start=${new Date(a).toISOString()}&end=${new Date(b).toISOString()}`;
    chunks.push(
      fetchJson<number[][]>(url, signal, { headers: { Accept: "application/json" } }).then((rows) => {
        if (!Array.isArray(rows)) throw new Error("cb shape");
        return rows
          .map((row) => ({
            t: Number(row[0]) * 1000,
            low: Number(row[1]),
            high: Number(row[2]),
            open: Number(row[3]),
            close: Number(row[4]),
            volume: Number(row[5]) || 0,
          }))
          .filter((c) => c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0);
      }),
    );
  }
  const parts = await Promise.all(chunks);
  const byT = new Map<number, Candle>();
  for (const part of parts) for (const c of part) byT.set(c.t, c);
  const candles = [...byT.values()].sort((a, b) => a.t - b.t);
  if (candles.length < 30) throw new Error("cb short");
  return candles;
}

async function fetchDeepDaily(signal: AbortSignal): Promise<Candle[]> {
  if (deepDailyCache && Date.now() - deepDailyCache.at < 30 * 60_000) {
    return deepDailyCache.candles;
  }
  const [coinbase, chain] = await Promise.all([
    fetchCoinbaseDaily(signal).catch(() => null),
    fetchBlockchainCloses(signal).catch(() => null),
  ]);
  let candles: Candle[] = [];
  if (chain && chain.length >= 30) candles = hydrateCloses(chain);
  if (coinbase && coinbase.length >= 30) {
    candles = stitchCandles(candles, coinbase);
  } else {
    const yahoo = await fetchYahooDaily(signal).catch(() => null);
    if (yahoo && yahoo.length >= 30) candles = stitchCandles(candles, yahoo);
  }
  if (candles.length < 30) {
    const okx = await fetchOkxCandles("6m", signal).catch(() => null);
    if (okx && okx.length >= 30) candles = stitchCandles(candles, okx);
  }
  if (candles.length < 30) throw new Error("deep daily short");
  deepDailyCache = { at: Date.now(), candles };
  return candles;
}

const OKX_BAR: Record<ChartRange, string> = {
  "1d": "15m",
  "1w": "1H",
  "1m": "4H",
  "6m": "1D",
};

async function fetchOkxCandles(range: ChartRange, signal: AbortSignal): Promise<Candle[]> {
  const bar = OKX_BAR[range];
  const spec = RANGE_SPEC[range];
  const j = await fetchJson<{ code: string; data?: string[][] }>(
    `https://www.okx.com/api/v5/market/history-candles?instId=BTC-USDT&bar=${bar}&limit=${Math.min(300, spec.limit)}`,
    signal,
  );
  if (j.code !== "0" || !j.data?.length) throw new Error("okx kline");
  const rows = j.data
    .map((row) => ({
      t: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]) || 0,
    }))
    .filter((c) => c.t > 0 && c.close > 0)
    .sort((a, b) => a.t - b.t);
  if (rows.length < 24) throw new Error("okx kline short");
  return rows;
}

function mergeTf(deep: Candle[], fine: Candle[], tf: ChartRange): Candle[] {
  return resampleToTf(stitchCandles(deep, fine), tf);
}

export const hyperliquidFeed: MarketFeed = {
  name: "hyperliquid",
  async load(range: ChartRange, signal: AbortSignal): Promise<LiveTape> {
    const [candles, ctx, deep] = await Promise.all([
      fetchHlCandles("1d", Date.now() - 800 * DAY_MS, signal),
      fetchHlCtx(signal),
      fetchDeepDaily(signal).catch(() => fetchHlCandles("1d", Date.now() - 800 * DAY_MS, signal)),
    ]);
    const merged = mergeTf(deep, candles, range);
    const last = merged[merged.length - 1]!;
    return {
      candles: merged,
      deep: resampleToTf(deep, range),
      quote: {
        source: "hyperliquid",
        price: ctx.price,
        change24h: ctx.change24h,
        high24h: last.high,
        low24h: last.low,
        volume24h: ctx.volume24h,
        longPct: 50,
        shortPct: 50,
      },
    };
  },
};

export const binanceFeed: MarketFeed = {
  name: "binance",
  async load(range: ChartRange, signal: AbortSignal): Promise<LiveTape> {
    const [native, deep, ticker, ls] = await Promise.all([
      fetchBinanceTf(range, signal),
      fetchDeepDaily(signal).catch(() => fetchHlCandles("1d", Date.now() - 800 * DAY_MS, signal)),
      fetchTicker(signal),
      fetchLongShort(signal).catch(() => ({ longPct: 52.82, shortPct: 47.18 })),
    ]);
    const merged = mergeTf(deep, native, range);
    if (merged.length < 16) throw new Error("short series");
    return {
      candles: merged,
      deep: resampleToTf(deep, range),
      quote: {
        source: "binance",
        price: ticker.price,
        change24h: ticker.change24h,
        high24h: ticker.high24h,
        low24h: ticker.low24h,
        volume24h: ticker.volume24h,
        longPct: ls.longPct,
        shortPct: ls.shortPct,
      },
    };
  },
};

export const okxFeed: MarketFeed = {
  name: "okx",
  async load(range: ChartRange, signal: AbortSignal): Promise<LiveTape> {
    const [native, deep, ticker] = await Promise.all([
      fetchOkxTf(range, signal),
      fetchDeepDaily(signal).catch(() => fetchOkxTf("1d", signal)),
      fetchJson<{ code: string; data?: Record<string, string>[] }>(
        "https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT-SWAP",
        signal,
      ),
    ]);
    const merged = mergeTf(deep, native, range);
    const last = merged[merged.length - 1]!;
    const row = ticker.data?.[0];
    const price = Number(row?.last) || last.close;
    const open = Number(row?.open24h) || last.open;
    return {
      candles: merged,
      deep: resampleToTf(deep, range),
      quote: {
        source: "okx",
        price,
        change24h: open > 0 ? ((price - open) / open) * 100 : 0,
        high24h: Number(row?.high24h) || last.high,
        low24h: Number(row?.low24h) || last.low,
        volume24h: Number(row?.volCcy24h) || 0,
        longPct: 52.82,
        shortPct: 47.18,
      },
    };
  },
};
