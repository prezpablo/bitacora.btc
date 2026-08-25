import type { Candle, HeatBucket, LiqCluster, LiqMagnet } from "./entities";

const DAY = 86_400_000;

const TIERS = [
  { lev: 5, w: 0.1, halfLife: 18 },
  { lev: 10, w: 0.22, halfLife: 12 },
  { lev: 25, w: 0.24, halfLife: 6 },
  { lev: 50, w: 0.2, halfLife: 3 },
  { lev: 100, w: 0.16, halfLife: 1.4 },
  { lev: 125, w: 0.08, halfLife: 1 },
] as const;

const ANCHORS = [
  { key: "close" as const, w: 0.55 },
  { key: "high" as const, w: 0.225 },
  { key: "low" as const, w: 0.225 },
];

const SIGMA = 1.15;
const KR = Math.max(2, Math.ceil(SIGMA * 3));
const KERNEL = (() => {
  const k = new Float64Array(KR * 2 + 1);
  let n = 0;
  for (let d = -KR; d <= KR; d++) {
    const g = Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
    k[d + KR] = g;
    n += g;
  }
  for (let i = 0; i < k.length; i++) k[i]! /= n;
  return k;
})();

export type HeatOpts = {
  bins?: number;
  maxCols?: number;
  min?: number;
  max?: number;
};

/** 5× liquida ~20% lejos del precio: envelope para ver imanes arriba y abajo. */
export function liquidationEnvelope(
  candles: { high: number; low: number }[],
  price = 0,
): { min: number; max: number } {
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of candles) {
    if (c.low > 0) lo = Math.min(lo, c.low);
    if (c.high > 0) hi = Math.max(hi, c.high);
  }
  if (price > 0) {
    lo = Math.min(lo, price);
    hi = Math.max(hi, price);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= 0) {
    return { min: 1, max: 2 };
  }
  const envLo = lo * (1 - 1 / 5);
  const envHi = hi * (1 + 1 / 5);
  return {
    min: Math.max(envLo * 0.99, 1e-6),
    max: envHi * 1.01,
  };
}

function thinCandles(candles: Candle[], maxN: number): Candle[] {
  const n = candles.length;
  if (n <= maxN) return candles;
  const out: Candle[] = [];
  const step = n / maxN;
  let i0 = 0;
  while (i0 < n) {
    const i1 = Math.max(i0 + 1, Math.min(n, Math.round((out.length + 1) * step)));
    const first = candles[i0]!;
    let high = first.high;
    let low = first.low;
    let vol = 0;
    let close = first.close;
    for (let i = i0; i < i1; i++) {
      const c = candles[i]!;
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      vol += c.volume;
      close = c.close;
    }
    out.push({ t: candles[i1 - 1]!.t, open: first.open, high, low, close, volume: vol });
    i0 = i1;
  }
  return out;
}

function binIndexLog(price: number, logMin: number, invSpan: number, bins: number) {
  const t = (Math.log(Math.max(price, 1e-6)) - logMin) * invSpan;
  return Math.max(0, Math.min(bins - 1, t | 0));
}

function addKernel(book: Float64Array, idx: number, weight: number) {
  const n = book.length;
  for (let k = 0; k < KERNEL.length; k++) {
    const i = idx + k - KR;
    if ((i >>> 0) >= n) continue;
    book[i]! += weight * KERNEL[k]!;
  }
}

function clearRange(book: Float64Array, i0: number, i1: number) {
  const a = i0 < i1 ? i0 : i1;
  const b = i0 < i1 ? i1 : i0;
  book.fill(0, a, b + 1);
}

function smooth1d(values: number[]) {
  const n = values.length;
  const next = values.slice();
  for (let i = 0; i < n; i++) {
    const a = values[i - 1] ?? values[i]!;
    const b = values[i]!;
    const c = values[i + 1] ?? values[i]!;
    next[i] = 0.18 * a + 0.64 * b + 0.18 * c;
  }
  return next;
}

export function summarizeLiquidations(clusters: LiqCluster[]): {
  magnets: LiqMagnet[];
  poc: number | null;
  vaLow: number | null;
  vaHigh: number | null;
} {
  if (clusters.length === 0) {
    return { magnets: [], poc: null, vaLow: null, vaHigh: null };
  }
  const tot = clusters.map((c) => c.long + c.short);
  const sum = tot.reduce((a, b) => a + b, 0);
  const peak = Math.max(...tot, 1);
  const pocIdx = tot.indexOf(peak);
  let lo = pocIdx;
  let hi = pocIdx;
  let acc = tot[pocIdx]!;
  while (acc < 0.7 * sum && (lo > 0 || hi < clusters.length - 1)) {
    const left = lo > 0 ? tot[lo - 1]! : -1;
    const right = hi < clusters.length - 1 ? tot[hi + 1]! : -1;
    if (right >= left) {
      hi += 1;
      acc += tot[hi]!;
    } else {
      lo -= 1;
      acc += tot[lo]!;
    }
  }
  const magnets = clusters
    .map((c, i) => {
      const intensity = tot[i]! / peak;
      const side: LiqMagnet["side"] =
        c.long > c.short * 1.25 ? "long" : c.short > c.long * 1.25 ? "short" : "mixed";
      return { price: c.price, intensity, side };
    })
    .filter((m, i) => {
      if (m.intensity < 0.2) return false;
      const prev = tot[i - 1] ?? 0;
      const next = tot[i + 1] ?? 0;
      return tot[i]! >= prev && tot[i]! >= next;
    })
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5);

  return {
    magnets,
    poc: clusters[pocIdx]!.price,
    vaLow: clusters[lo]!.price,
    vaHigh: clusters[hi]!.price,
  };
}

/**
 * LiqMap / Coinglass-style book.
 * Decay is lazy (per-tier scale) so we never scan all bins on each bar.
 * Gaussian kernel is precomputed. Source is thinned to ~2× columns.
 */
export function buildLiquidationMap(
  candles: Candle[],
  opts: HeatOpts = {},
): { heatmap: HeatBucket[]; clusters: LiqCluster[]; min: number; max: number } {
  if (candles.length === 0) {
    return { heatmap: [], clusters: [], min: 0, max: 1 };
  }

  const binCount = Math.max(48, Math.min(180, Math.round(opts.bins ?? 120)));
  const maxCols = Math.max(40, Math.min(160, Math.round(opts.maxCols ?? 96)));
  const src = candles.length > maxCols * 2 ? thinCandles(candles, maxCols * 2) : candles;

  let min = opts.min ?? Infinity;
  let max = opts.max ?? -Infinity;
  if (opts.min == null || opts.max == null) {
    min = Infinity;
    max = -Infinity;
    for (const c of src) {
      min = Math.min(min, c.low);
      max = Math.max(max, c.high);
    }
    min = Math.max(min * 0.8, 1e-6);
    max = Math.max(max * 1.2, min * 1.01);
  }
  min = Math.max(min, 1e-6);
  max = Math.max(max, min * 1.002);
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const invSpan = binCount / Math.max(logMax - logMin, 1e-9);

  const prices = new Float64Array(binCount);
  for (let k = 0; k < binCount; k++) {
    prices[k] = Math.exp(logMin + ((k + 0.5) / binCount) * (logMax - logMin));
  }

  const nT = TIERS.length;
  const longs = Array.from({ length: nT }, () => new Float64Array(binCount));
  const shorts = Array.from({ length: nT }, () => new Float64Array(binCount));
  const scale = new Float64Array(nT);
  scale.fill(1);

  const stride = Math.max(1, Math.ceil(src.length / maxCols));
  const heatmap: HeatBucket[] = [];
  let prevT = src[0]!.t;

  const snap = (t: number): HeatBucket => {
    const bins = new Array<{ price: number; long: number; short: number }>(binCount);
    for (let k = 0; k < binCount; k++) {
      let long = 0;
      let short = 0;
      for (let ti = 0; ti < nT; ti++) {
        const s = scale[ti]!;
        long += longs[ti]![k]! * s;
        short += shorts[ti]![k]! * s;
      }
      bins[k] = { price: prices[k]!, long, short };
    }
    return { t, bins };
  };

  for (let ci = 0; ci < src.length; ci++) {
    const c = src[ci]!;
    const dtDays = Math.max((c.t - prevT) / DAY, 0);
    prevT = c.t;

    if (dtDays > 0) {
      for (let ti = 0; ti < nT; ti++) {
        const d = Math.pow(0.5, dtDays / TIERS[ti]!.halfLife);
        if (d >= 0.999) continue;
        scale[ti]! *= d;
        if (scale[ti]! < 1e-8) {
          longs[ti]!.fill(0);
          shorts[ti]!.fill(0);
          scale[ti] = 1;
        }
      }
    }

    const i0 = binIndexLog(c.low, logMin, invSpan, binCount);
    const i1 = binIndexLog(c.high, logMin, invSpan, binCount);
    const wipe0 = Math.max(0, Math.min(i0, i1) - 1);
    const wipe1 = Math.min(binCount - 1, Math.max(i0, i1) + 1);
    for (let ti = 0; ti < nT; ti++) {
      clearRange(longs[ti]!, wipe0, wipe1);
      clearRange(shorts[ti]!, wipe0, wipe1);
    }

    const ntl = Math.max(c.volume, 1e-8) * Math.max(c.close, 1);
    const lo = c.low;
    const hi = c.high;
    for (const { key, w: locW } of ANCHORS) {
      const entry = c[key];
      for (let ti = 0; ti < nT; ti++) {
        const { lev, w } = TIERS[ti]!;
        const mass = ntl * locW * w;
        const s = scale[ti]!;
        if (s <= 0) continue;
        const longPx = entry * (1 - 1 / lev);
        const shortPx = entry * (1 + 1 / lev);
        if (longPx < lo || longPx > hi) {
          addKernel(longs[ti]!, binIndexLog(longPx, logMin, invSpan, binCount), mass / s);
        }
        if (shortPx < lo || shortPx > hi) {
          addKernel(shorts[ti]!, binIndexLog(shortPx, logMin, invSpan, binCount), mass / s);
        }
      }
    }

    if (ci % stride === 0 || ci === src.length - 1) {
      heatmap.push(snap(c.t));
    }
  }

  const lastCol = heatmap[heatmap.length - 1];
  const clusters: LiqCluster[] = lastCol
    ? lastCol.bins.map((b) => ({ price: b.price, long: b.long, short: b.short }))
    : [];
  if (clusters.length) {
    const smL = smooth1d(clusters.map((c) => c.long));
    const smS = smooth1d(clusters.map((c) => c.short));
    for (let i = 0; i < clusters.length; i++) {
      clusters[i]!.long = smL[i]!;
      clusters[i]!.short = smS[i]!;
    }
  }

  return { heatmap, clusters, min, max };
}

function nearestCol(heatmap: HeatBucket[], t: number) {
  if (heatmap.length === 0) return null;
  let best = heatmap[0]!;
  let d = Math.abs(best.t - t);
  for (let i = 1; i < heatmap.length; i++) {
    const col = heatmap[i]!;
    const n = Math.abs(col.t - t);
    if (n < d) {
      best = col;
      d = n;
    }
  }
  return best;
}

function sampleBin(
  bins: { price: number; long: number; short: number }[],
  price: number,
): { long: number; short: number } {
  if (bins.length === 0) return { long: 0, short: 0 };
  const lp = Math.log(Math.max(price, 1e-6));
  let lo = 0;
  let hi = bins.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (bins[mid]!.price < price) lo = mid + 1;
    else hi = mid;
  }
  const i = lo;
  const a = bins[Math.max(0, i - 1)]!;
  const b = bins[Math.min(bins.length - 1, i)]!;
  const la = Math.log(Math.max(a.price, 1e-6));
  const lb = Math.log(Math.max(b.price, 1e-6));
  const span = lb - la;
  const k = span === 0 ? 1 : Math.max(0, Math.min(1, (lp - la) / span));
  return {
    long: a.long + (b.long - a.long) * k,
    short: a.short + (b.short - a.short) * k,
  };
}

/** Promedio ponderado de mapas de liquidación (mismo envelope log). */
export function blendLiquidationMaps(
  parts: { heatmap: HeatBucket[]; clusters: LiqCluster[]; weight: number }[],
  opts: { bins: number; cols: number; min: number; max: number },
): { heatmap: HeatBucket[]; clusters: LiqCluster[] } {
  const ready = parts.filter((p) => p.heatmap.length >= 8 && p.weight > 0);
  if (ready.length === 0) return { heatmap: [], clusters: [] };
  if (ready.length === 1) {
    return { heatmap: ready[0]!.heatmap, clusters: ready[0]!.clusters };
  }

  const binCount = Math.max(48, Math.min(180, Math.round(opts.bins)));
  const cols = Math.max(24, Math.min(160, Math.round(opts.cols)));
  const min = Math.max(opts.min, 1e-6);
  const max = Math.max(opts.max, min * 1.002);
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const prices = Array.from({ length: binCount }, (_, k) =>
    Math.exp(logMin + ((k + 0.5) / binCount) * (logMax - logMin)),
  );

  let t0 = Infinity;
  let t1 = -Infinity;
  for (const p of ready) {
    t0 = Math.min(t0, p.heatmap[0]!.t);
    t1 = Math.max(t1, p.heatmap[p.heatmap.length - 1]!.t);
  }
  const span = Math.max(t1 - t0, 1);
  const wsum = ready.reduce((s, p) => s + p.weight, 0) || 1;

  const heatmap: HeatBucket[] = [];
  for (let i = 0; i < cols; i++) {
    const t = t0 + (i / Math.max(cols - 1, 1)) * span;
    const bins = prices.map((price) => {
      let long = 0;
      let short = 0;
      for (const p of ready) {
        const col = nearestCol(p.heatmap, t);
        if (!col) continue;
        const s = sampleBin(col.bins, price);
        long += s.long * p.weight;
        short += s.short * p.weight;
      }
      return { price, long: long / wsum, short: short / wsum };
    });
    heatmap.push({ t, bins });
  }

  const last = heatmap[heatmap.length - 1]!;
  const clusters: LiqCluster[] = last.bins.map((b) => ({
    price: b.price,
    long: b.long,
    short: b.short,
  }));
  if (clusters.length) {
    const smL = smooth1d(clusters.map((c) => c.long));
    const smS = smooth1d(clusters.map((c) => c.short));
    for (let i = 0; i < clusters.length; i++) {
      clusters[i]!.long = smL[i]!;
      clusters[i]!.short = smS[i]!;
    }
  }
  return { heatmap, clusters };
}
