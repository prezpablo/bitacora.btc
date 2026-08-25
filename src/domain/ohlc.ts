import type { Candle, ChartRange } from "./entities";

export const DAY_MS = 86_400_000;

export type TfSpec = {
  binance: string;
  okx: string;
  barsHome: number;
  stepMs: number;
};

export const TF_SPEC: Record<ChartRange, TfSpec> = {
  "1d": { binance: "1d", okx: "1D", barsHome: 120, stepMs: DAY_MS },
  "1w": { binance: "1w", okx: "1W", barsHome: 120, stepMs: 7 * DAY_MS },
  "1m": { binance: "1M", okx: "1M", barsHome: 120, stepMs: 30 * DAY_MS },
  "6m": { binance: "1M", okx: "1M", barsHome: 36, stepMs: 182 * DAY_MS },
};

export function homeLookback(tf: ChartRange): number {
  return TF_SPEC[tf].barsHome * TF_SPEC[tf].stepMs;
}

export function weekStartUtc(t: number): number {
  const d = new Date(t);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff);
}

export function monthStartUtc(t: number): number {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

export function semesterStartUtc(t: number): number {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() < 6 ? 0 : 6, 1);
}

export function bucketStart(t: number, tf: ChartRange): number {
  if (tf === "1w") return weekStartUtc(t);
  if (tf === "1m") return monthStartUtc(t);
  if (tf === "6m") return semesterStartUtc(t);
  return Math.floor(t / DAY_MS) * DAY_MS;
}

function absorb(map: Map<number, Candle>, key: number, c: Candle) {
  const prev = map.get(key);
  if (!prev) {
    map.set(key, {
      t: key,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    });
    return;
  }
  prev.high = Math.max(prev.high, c.high);
  prev.low = Math.min(prev.low, c.low);
  prev.close = c.close;
  prev.volume += c.volume;
}

/** Reagrupa cualquier serie al intervalo fijo del botón (1D / 1S / 1M / 6M). */
export function resampleToTf(candles: Candle[], tf: ChartRange): Candle[] {
  if (candles.length === 0) return [];
  const map = new Map<number, Candle>();
  for (const c of candles) {
    if (!(c.open > 0 && c.close > 0)) continue;
    absorb(map, bucketStart(c.t, tf), c);
  }
  return [...map.values()].sort((a, b) => a.t - b.t);
}
