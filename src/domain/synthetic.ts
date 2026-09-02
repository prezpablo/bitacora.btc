import type { Candle, ChartRange } from "./entities";

const DAY = 86_400_000;

function mulberry32(seed: number) {
  return function rand() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function walkSeries(now: number, start: number, interval: number): Candle[] {
  const rand = mulberry32(20260822 + Math.floor(start / DAY));
  const out: Candle[] = [];
  let prevClose = 71_200;
  for (let t = start; t <= now; t += interval) {
    const july = t >= Date.UTC(2026, 5, 20) && t < Date.UTC(2026, 7, 12);
    const squeeze = t >= Date.UTC(2026, 7, 18);
    let drift = -4;
    if (july) drift = -22;
    if (squeeze) drift = 110;
    else if (t >= Date.UTC(2026, 7, 12)) drift = 32;
    const noise = (rand() - 0.48) * (squeeze ? 420 : 150);
    const close = Math.max(56_200, prevClose + drift * (interval / DAY) + noise);
    const spread = Math.max(40, close * 0.003 * (squeeze ? 2.4 : 1));
    const open = prevClose;
    let high = Math.max(open, close) + rand() * spread;
    let low = Math.min(open, close) - rand() * spread;
    let bodyClose = close;
    if (rand() < 0.1 && !squeeze) {
      bodyClose = open + (rand() - 0.5) * spread * 0.08;
      const style = rand();
      if (style < 0.33) {
        high = open + spread * (0.15 + rand() * 0.25);
        low = open - spread * (1.1 + rand());
      } else if (style < 0.66) {
        high = open + spread * (1.1 + rand());
        low = open - spread * (0.15 + rand() * 0.25);
      } else {
        high = open + spread * (0.7 + rand() * 0.6);
        low = open - spread * (0.7 + rand() * 0.6);
      }
    }
    const volume = 110 + rand() * 90 + (squeeze ? 240 : 0);
    out.push({ t, open, high, low, close: bodyClose, volume });
    prevClose = bodyClose;
  }
  if (out.length) {
    const last = out[out.length - 1]!;
    last.close = 77_200;
    last.high = Math.max(last.high, 78_820);
    last.low = Math.min(last.low, last.close);
  }
  return out;
}

export function syntheticCandles(range: ChartRange, now = Date.UTC(2026, 7, 22, 16, 0, 0)): Candle[] {
  const interval = range === "1d" ? DAY : range === "1w" ? 7 * DAY : range === "1m" ? 30 * DAY : 182 * DAY;
  const lookback =
    range === "1d" ? 400 * DAY : range === "1w" ? 900 * DAY : range === "1m" ? 12 * 365 * DAY : 16 * 365 * DAY;
  return walkSeries(now, now - lookback, interval);
}

export function syntheticDailyHistory(now = Date.UTC(2026, 7, 22, 16, 0, 0)): Candle[] {
  const start = Date.UTC(2013, 3, 28);
  const rand = mulberry32(20130428);
  const n = Math.max(1, Math.floor((now - start) / DAY));
  const out: Candle[] = [];
  let prev = 135;
  for (let i = 0; i <= n; i++) {
    const t = start + i * DAY;
    const y = i / n;
    const target = 135 * Math.exp(Math.log(77_200 / 135) * y);
    const close = Math.max(50, target * (0.975 + rand() * 0.05));
    const open = prev;
    const spread = Math.max(2, close * 0.018);
    const high = Math.max(open, close) + rand() * spread;
    const low = Math.max(1, Math.min(open, close) - rand() * spread);
    out.push({ t, open, high, low, close, volume: 70 + rand() * 50 });
    prev = close;
  }
  return out;
}
