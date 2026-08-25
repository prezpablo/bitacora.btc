import type { Candle, ChartRange, MarketPayload, MarketTick } from "./entities";
import { DAY_MS, homeLookback } from "./ohlc";

export { DAY_MS };

export const RANGE_SPEC: Record<
  ChartRange,
  { interval: string; limit: number; lookback: number }
> = {
  "1d": { interval: "1d", limit: 1000, lookback: homeLookback("1d") },
  "1w": { interval: "1w", limit: 1000, lookback: homeLookback("1w") },
  "1m": { interval: "1M", limit: 500, lookback: homeLookback("1m") },
  "6m": { interval: "1M", limit: 500, lookback: homeLookback("6m") },
};

export function stitchCandles(history: Candle[], fine: Candle[]): Candle[] {
  if (fine.length === 0) return history;
  if (history.length === 0) return fine;
  const t0 = fine[0]!.t;
  const head = history.filter((c) => c.t + 12 * 3_600_000 < t0);
  return [...head, ...fine];
}

export function hydrateCloses(rows: { t: number; close: number }[]): Candle[] {
  const out: Candle[] = [];
  let prev = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    if (!(r.close > 0) || !Number.isFinite(r.close)) continue;
    const nxt = rows[i + 1]?.close;
    const open = prev > 0 ? prev : r.close;
    const close = r.close;
    const move = Math.abs(close - open);
    const vol = Math.max(close * 0.028, move * 0.55, close * 0.012);
    const dir = (nxt ?? close) >= close ? 1 : -1;
    const high = Math.max(open, close) + vol * (0.35 + 0.2 * (dir > 0 ? 1 : 0.4));
    const low = Math.max(close * 0.05, Math.min(open, close) - vol * (0.35 + 0.2 * (dir < 0 ? 1 : 0.4)));
    out.push({ t: r.t, open, high, low, close, volume: 0 });
    prev = close;
  }
  return out;
}

export function applyTick(market: MarketPayload, tick: MarketTick): MarketPayload {
  if (!(tick.price > 0)) return market;
  const candles = market.candles.slice();
  const last = candles[candles.length - 1];
  if (last) {
    candles[candles.length - 1] = {
      ...last,
      close: tick.price,
      high: Math.max(last.high, tick.price, tick.high24h || 0),
      low: Math.min(last.low, tick.price, tick.low24h || last.low),
    };
  }
  return {
    ...market,
    price: tick.price,
    change24h: tick.change24h,
    high24h: tick.high24h || market.high24h,
    low24h: tick.low24h || market.low24h,
    asOf: tick.asOf || Date.now(),
    candles,
  };
}