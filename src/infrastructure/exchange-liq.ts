import { resampleToTf, type Candle, type ChartRange, type HeatBucket, type LiqCluster } from "@/domain";
import { blendLiquidationMaps, buildLiquidationMap } from "@/domain";
import { fetchJson } from "./http";

type VenueTape = { name: string; candles: Candle[]; weight: number };

type Ival = {
  bn: string;
  okx: string;
  bybit: string;
  bitget: string;
  gate: string;
  hl: string;
  kucoin: number;
  htx: string;
  mexc: string;
  kraken: string;
  bingx: string;
  n: number;
};

const IVAL: Record<ChartRange, Ival> = {
  "1d": { bn: "15m", okx: "15m", bybit: "15", bitget: "15m", gate: "15m", hl: "15m", kucoin: 15, htx: "15min", mexc: "Min15", kraken: "15m", bingx: "15m", n: 120 },
  "1w": { bn: "1h", okx: "1H", bybit: "60", bitget: "1H", gate: "1h", hl: "1h", kucoin: 60, htx: "60min", mexc: "Min60", kraken: "1h", bingx: "1h", n: 180 },
  "1m": { bn: "4h", okx: "4H", bybit: "240", bitget: "4H", gate: "4h", hl: "4h", kucoin: 240, htx: "4hour", mexc: "Hour4", kraken: "4h", bingx: "4h", n: 180 },
  "6m": { bn: "1d", okx: "1D", bybit: "D", bitget: "1D", gate: "1d", hl: "1d", kucoin: 1440, htx: "1day", mexc: "Day1", kraken: "1d", bingx: "1d", n: 182 },
};

function asCandle(t: number, o: number, h: number, l: number, c: number, vol: number): Candle | null {
  if (!(t > 0 && o > 0 && h > 0 && l > 0 && c > 0)) return null;
  const tMs = t < 20_000_000_000 ? t * 1000 : t;
  return { t: tMs, open: o, high: h, low: l, close: c, volume: Math.max(vol, 0) };
}

function sortTrim(rows: (Candle | null)[], n: number): Candle[] {
  const out = rows.filter((c): c is Candle => !!c).sort((a, b) => a.t - b.t);
  return out.length > n ? out.slice(-n) : out;
}

function weightOf(candles: Candle[]) {
  let w = 0;
  for (const c of candles) w += Math.max(c.volume, 0) * Math.max(c.close, 0);
  return w > 0 ? w : candles.length;
}

async function withTime<T>(fn: (signal: AbortSignal) => Promise<T>, parent: AbortSignal): Promise<T> {
  const local = AbortSignal.timeout(4000);
  const signal = AbortSignal.any([parent, local]);
  return fn(signal);
}

async function binance(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const rows = await fetchJson<unknown[][]>(
    `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=${ival.bn}&limit=${ival.n}`,
    signal,
  ).catch(() =>
    fetchJson<unknown[][]>(
      `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${ival.bn}&limit=${ival.n}`,
      signal,
    ),
  );
  const candles = sortTrim(
    rows.map((r) => asCandle(Number(r[0]), Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4]), Number(r[7] || r[5]) / Math.max(Number(r[4]), 1))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("binance");
  return { name: "Binance", candles, weight: weightOf(candles) };
}

async function okx(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const j = await fetchJson<{ code: string; data?: string[][] }>(
    `https://www.okx.com/api/v5/market/history-candles?instId=BTC-USDT-SWAP&bar=${ival.okx}&limit=${Math.min(300, ival.n)}`,
    signal,
  );
  if (j.code !== "0" || !j.data) throw new Error("okx");
  const candles = sortTrim(
    j.data.map((r) => asCandle(Number(r[0]), Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4]), Number(r[7] || r[5]) / Math.max(Number(r[4]), 1))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("okx");
  return { name: "OKX", candles, weight: weightOf(candles) };
}

async function bybit(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const j = await fetchJson<{ result?: { list?: string[][] } }>(
    `https://api.bybit.com/v5/market/kline?category=linear&symbol=BTCUSDT&interval=${ival.bybit}&limit=${ival.n}`,
    signal,
    { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } },
  );
  const candles = sortTrim(
    (j.result?.list ?? []).map((r) => asCandle(Number(r[0]), Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4]), Number(r[6] || r[5]) / Math.max(Number(r[4]), 1))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("bybit");
  return { name: "Bybit", candles, weight: weightOf(candles) };
}

async function bitget(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const j = await fetchJson<{ code: string; data?: string[][] }>(
    `https://api.bitget.com/api/v2/mix/market/candles?symbol=BTCUSDT&productType=USDT-FUTURES&granularity=${ival.bitget}&limit=${ival.n}`,
    signal,
  );
  if (j.code !== "00000" || !j.data) throw new Error("bitget");
  const candles = sortTrim(
    j.data.map((r) => asCandle(Number(r[0]), Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4]), Number(r[6] || r[5]) / Math.max(Number(r[4]), 1))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("bitget");
  return { name: "Bitget", candles, weight: weightOf(candles) };
}

async function hyperliquid(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: { coin: "BTC", interval: ival.hl, startTime: Date.now() - 400 * 86_400_000, endTime: Date.now() },
    }),
    signal,
  });
  if (!res.ok) throw new Error("hl");
  const json = (await res.json()) as { t: number; o: string; h: string; l: string; c: string; v: string }[];
  const candles = sortTrim(
    json.map((c) => asCandle(Number(c.t), Number(c.o), Number(c.h), Number(c.l), Number(c.c), Number(c.v))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("hl");
  return { name: "Hyperliquid", candles, weight: weightOf(candles) };
}

async function gate(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const rows = await fetchJson<{ t: number; o: string; h: string; l: string; c: string; sum?: string; v?: number }[]>(
    `https://api.gateio.ws/api/v4/futures/usdt/candlesticks?contract=BTC_USDT&interval=${ival.gate}&limit=${ival.n}`,
    signal,
  );
  const candles = sortTrim(
    rows.map((r) => asCandle(Number(r.t), Number(r.o), Number(r.h), Number(r.l), Number(r.c), Number(r.sum || r.v) / Math.max(Number(r.c), 1))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("gate");
  return { name: "Gate", candles, weight: weightOf(candles) };
}

async function kucoin(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const j = await fetchJson<{ code: string; data?: number[][] }>(
    `https://api-futures.kucoin.com/api/v1/kline/query?symbol=XBTUSDTM&granularity=${ival.kucoin}`,
    signal,
  );
  if (j.code !== "200000" || !j.data) throw new Error("kucoin");
  const candles = sortTrim(
    j.data.map((r) => asCandle(Number(r[0]), Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4]), Number(r[6] || r[5]) / Math.max(Number(r[4]), 1))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("kucoin");
  return { name: "KuCoin", candles, weight: weightOf(candles) };
}

async function htx(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const j = await fetchJson<{ status: string; data?: { id: number; open: number; high: number; low: number; close: number; trade_turnover?: number; vol?: number }[] }>(
    `https://api.hbdm.com/linear-swap-ex/market/history/kline?contract_code=BTC-USDT&period=${ival.htx}&size=${ival.n}`,
    signal,
  );
  if (j.status !== "ok" || !j.data) throw new Error("htx");
  const candles = sortTrim(
    j.data.map((r) => asCandle(r.id, r.open, r.high, r.low, r.close, (r.trade_turnover || r.vol || 0) / Math.max(r.close, 1))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("htx");
  return { name: "HTX", candles, weight: weightOf(candles) };
}

async function mexc(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const j = await fetchJson<{ success: boolean; data?: { time: number[]; open: number[]; high: number[]; low: number[]; close: number[]; vol?: number[] } }>(
    `https://contract.mexc.com/api/v1/contract/kline/BTC_USDT?interval=${ival.mexc}`,
    signal,
  );
  if (!j.success || !j.data?.time) throw new Error("mexc");
  const d = j.data;
  const candles = sortTrim(
    d.time.map((t, i) => asCandle(t, d.open[i]!, d.high[i]!, d.low[i]!, d.close[i]!, (d.vol?.[i] || 0) / Math.max(d.close[i]!, 1))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("mexc");
  return { name: "MEXC", candles, weight: weightOf(candles) };
}

async function kraken(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const j = await fetchJson<{ candles?: { time: number; open: string; high: string; low: string; close: string; volume: string }[] }>(
    `https://futures.kraken.com/api/charts/v1/trade/PF_XBTUSD/${ival.kraken}?count=${ival.n}`,
    signal,
  );
  const candles = sortTrim(
    (j.candles ?? []).map((r) => asCandle(r.time, Number(r.open), Number(r.high), Number(r.low), Number(r.close), Number(r.volume))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("kraken");
  return { name: "Kraken", candles, weight: weightOf(candles) };
}

async function bingx(ival: Ival, signal: AbortSignal): Promise<VenueTape> {
  const j = await fetchJson<{ code: number; data?: { open: string; high: string; low: string; close: string; volume: string; time: number }[] }>(
    `https://open-api.bingx.com/openApi/swap/v2/quote/klines?symbol=BTC-USDT&interval=${ival.bingx}&limit=${ival.n}`,
    signal,
  );
  if (j.code !== 0 || !j.data) throw new Error("bingx");
  const candles = sortTrim(
    j.data.map((r) => asCandle(r.time, Number(r.open), Number(r.high), Number(r.low), Number(r.close), Number(r.volume))),
    ival.n,
  );
  if (candles.length < 24) throw new Error("bingx");
  return { name: "BingX", candles, weight: weightOf(candles) };
}

const FETCHERS = [binance, okx, bybit, bitget, hyperliquid, gate, kucoin, htx, mexc, kraken, bingx];

let cache: { key: string; at: number; tapes: VenueTape[] } | null = null;

export async function fetchTopExchangeTapes(range: ChartRange, signal: AbortSignal): Promise<VenueTape[]> {
  const key = range;
  if (cache && cache.key === key && Date.now() - cache.at < 90_000) return cache.tapes;
  const ival = IVAL[range];
  const settled = await Promise.allSettled(FETCHERS.map((fn) => withTime((s) => fn(ival, s), signal)));
  const tapes = settled
    .flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);
  if (tapes.length) cache = { key, at: Date.now(), tapes };
  return tapes;
}

export function blendExchangeLiquidation(
  tapes: VenueTape[],
  env: { min: number; max: number },
  cols: number,
  tf: ChartRange = "1w",
): { heatmap: HeatBucket[]; clusters: LiqCluster[]; venues: string[] } | null {
  if (tapes.length < 2) return null;
  const parts = tapes.map((tape) => {
    const series = resampleToTf(tape.candles, tf);
    const map = buildLiquidationMap(series, {
      bins: 120,
      maxCols: cols,
      min: env.min,
      max: env.max,
    });
    return { heatmap: map.heatmap, clusters: map.clusters, weight: tape.weight };
  });
  const blended = blendLiquidationMaps(parts, { bins: 120, cols, min: env.min, max: env.max });
  if (blended.heatmap.length < 8) return null;
  return { ...blended, venues: tapes.map((t) => t.name) };
}
