import type { Candle } from "./entities";

const DAY = 86_400_000;

export const MA_WINDOWS_MS: Record<"ema1d" | "ema1w" | "ema1m" | "ema6m", number> =
  {
    ema1d: DAY,
    ema1w: 7 * DAY,
    ema1m: 30 * DAY,
    ema6m: 180 * DAY,
  };

export function rollingTimeEma(
  series: { t: number; close: number }[],
  atTimes: number[],
  windowMs: number,
): (number | null)[] {
  if (series.length === 0) return atTimes.map(() => null);

  let ema: number | null = null;
  let prevT = 0;
  const samples: { t: number; v: number }[] = [];

  for (const p of series) {
    if (ema == null) {
      ema = p.close;
    } else {
      const dt = Math.max(p.t - prevT, 1);
      const a = 1 - Math.exp(-dt / windowMs);
      ema = a * p.close + (1 - a) * ema;
    }
    prevT = p.t;
    samples.push({ t: p.t, v: ema });
  }

  const out: (number | null)[] = [];
  let j = 0;
  for (const t of atTimes) {
    while (j + 1 < samples.length && samples[j + 1]!.t <= t) j += 1;
    const s = samples[j];
    out.push(!s || s.t > t ? null : s.v);
  }
  return out;
}

export function lastDefined(values: (number | null)[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v != null) return v;
  }
  return null;
}

export function extent(values: number[], pad = 0.012): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  const span = Math.max(max - min, max * 0.01);
  return [min - span * pad, max + span * pad];
}

export function resampleDaily(candles: Candle[]): { t: number; close: number }[] {
  const byDay = new Map<number, Candle>();
  for (const c of candles) {
    const day = Math.floor(c.t / DAY) * DAY;
    byDay.set(day, c);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, c]) => ({ t, close: c.close }));
}

const WEEK = 7 * DAY;

/** Semana UTC (lunes 00:00): OHLC + volumen para el POC estable. */
export function resampleWeekly(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];
  const byW = new Map<number, Candle>();
  for (const c of candles) {
    const week = Math.floor(c.t / WEEK) * WEEK;
    const prev = byW.get(week);
    if (!prev) {
      byW.set(week, { t: week, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume });
      continue;
    }
    prev.high = Math.max(prev.high, c.high);
    prev.low = Math.min(prev.low, c.low);
    prev.close = c.close;
    prev.volume += c.volume;
  }
  return [...byW.values()].sort((a, b) => a.t - b.t);
}

export type CandleKind = "bull" | "bear" | "doji" | "dragonfly" | "gravestone";

export function candleKind(c: Candle): CandleKind {
  const span = c.high - c.low;
  const body = Math.abs(c.close - c.open);
  if (span <= 0 || body / span <= 0.1) {
    const upper = c.high - Math.max(c.open, c.close);
    const lower = Math.min(c.open, c.close) - c.low;
    if (span > 0 && lower / span >= 0.62) return "dragonfly";
    if (span > 0 && upper / span >= 0.62) return "gravestone";
    return "doji";
  }
  return c.close >= c.open ? "bull" : "bear";
}

export const KIND_LABEL: Record<CandleKind, string> = {
  bull: "Alcista",
  bear: "Bajista",
  doji: "Doji",
  dragonfly: "Doji libélula",
  gravestone: "Doji lápida",
};

export function isDojiKind(k: CandleKind) {
  return k === "doji" || k === "dragonfly" || k === "gravestone";
}

/** d3/TV-style nice ticks on a log domain */
export function niceLogTicks(min: number, max: number, maxTicks = 6): number[] {
  const lo = Math.max(min, 1e-6);
  const hi = Math.max(max, lo * 1.001);
  const out: number[] = [];
  const startExp = Math.floor(Math.log10(lo));
  const endExp = Math.ceil(Math.log10(hi));
  const mags = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9];
  for (let e = startExp; e <= endExp; e++) {
    const base = 10 ** e;
    for (const m of mags) {
      const v = m * base;
      if (v >= lo * 0.995 && v <= hi * 1.005) out.push(v);
    }
  }
  if (out.length <= maxTicks) return out;
  const step = Math.ceil(out.length / maxTicks);
  const thinned = out.filter((_, i) => i % step === 0);
  if (thinned[thinned.length - 1] !== out[out.length - 1]) thinned.push(out[out.length - 1]!);
  return thinned;
}

export function niceLinearTicks(min: number, max: number, maxTicks = 7): number[] {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const span = Math.max(hi - lo, Math.abs(hi) * 0.008, 1e-6);
  const raw = span / Math.max(maxTicks - 1, 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const err = raw / mag;
  let step = mag;
  if (err >= 7.5) step = 10 * mag;
  else if (err >= 3.5) step = 5 * mag;
  else if (err >= 1.5) step = 2 * mag;
  const start = Math.ceil((lo - step * 1e-9) / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 0.01; v += step) {
    out.push(Number(v.toPrecision(10)));
    if (out.length > 16) break;
  }
  return out.length ? out : [lo, hi];
}

export function axisTicks(min: number, max: number, maxTicks = 7): number[] {
  if (!(min > 0) || max / min >= 1.85) return niceLogTicks(min, max, maxTicks);
  return niceLinearTicks(min, max, maxTicks);
}

const HOUR = 3_600_000;

export function niceTimeTicks(t0: number, t1: number, maxTicks = 6): number[] {
  const span = Math.max(t1 - t0, 1);
  const out: number[] = [];
  const pushRange = (next: (t: number) => number, start: number) => {
    let t = start;
    let n = 0;
    while (t <= t1 && n < 36) {
      if (t >= t0) out.push(t);
      t = next(t);
      n += 1;
    }
  };

  if (span <= 18 * HOUR) {
    const step = 2 * HOUR;
    pushRange((t) => t + step, Math.ceil(t0 / step) * step);
  } else if (span <= 3 * DAY) {
    const step = 6 * HOUR;
    pushRange((t) => t + step, Math.ceil(t0 / step) * step);
  } else if (span <= 14 * DAY) {
    const start = startOfLocalDay(t0 + DAY - 1);
    pushRange((t) => t + DAY, start < t0 ? start + DAY : start);
  } else if (span <= 50 * DAY) {
    const start = startOfLocalWeek(t0);
    pushRange((t) => t + 7 * DAY, start < t0 ? start + 7 * DAY : start);
  } else if (span <= 420 * DAY) {
    const d = new Date(t0);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() < t0) d.setMonth(d.getMonth() + 1);
    pushRange((t) => {
      const n = new Date(t);
      n.setMonth(n.getMonth() + 1);
      return n.getTime();
    }, d.getTime());
  } else {
    const d = new Date(t0);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() < t0) d.setFullYear(d.getFullYear() + 1);
    pushRange((t) => {
      const n = new Date(t);
      n.setFullYear(n.getFullYear() + 1);
      return n.getTime();
    }, d.getTime());
  }

  if (out.length <= maxTicks) return out;
  const step = Math.ceil(out.length / maxTicks);
  return out.filter((_, i) => i % step === 0);
}

function startOfLocalDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfLocalWeek(t: number) {
  const d = new Date(startOfLocalDay(t));
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}


