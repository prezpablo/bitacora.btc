import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import {
  TF_SPEC,
  axisTicks,
  candleKind,
  isDojiKind,
  liquidationEnvelope,
  niceTimeTicks,
  type Candle,
  type HeatBucket,
  type MaKey,
  type MarketPayload,
} from "@/domain";
import { cn, formatUsd } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { slowNet } from "@/lib/net";
import { Button } from "@/components/ui/button";

const MA_META: { key: MaKey; tag: string; color: string; width: number }[] = [
  { key: "ema1d", tag: "1D", color: "var(--color-ma-1d)", width: 1.05 },
  { key: "ema1w", tag: "1S", color: "var(--color-ma-1w)", width: 1.12 },
  { key: "ema1m", tag: "1M", color: "var(--color-ma-1m)", width: 1.2 },
  { key: "ema6m", tag: "6M", color: "var(--color-ma-6m)", width: 1.55 },
];

const PAD = { l: 18, t: 8, b: 24, vol: 28 };
const GAP = 6;

const KIND_HEX: Record<string, string> = {
  bull: "#0ecb81",
  bear: "#f6465d",
  doji: "#848e9c",
  dragonfly: "#848e9c",
  gravestone: "#848e9c",
};

const HEAT_STOPS: [number, string][] = [
  [0, "var(--color-heat-0)"],
  [0.18, "var(--color-heat-1)"],
  [0.38, "var(--color-heat-2)"],
  [0.55, "var(--color-heat-3)"],
  [0.78, "var(--color-heat-4)"],
  [1, "var(--color-heat-5)"],
];

type ZoomJob = {
  key: string;
  candles: Candle[];
  bins: number;
  maxCols: number;
  min: number;
  max: number;
  t0: number;
  t1: number;
};

let zoomWorker: Worker | null = null;

function liqZoomWorker() {
  if (!zoomWorker) {
    zoomWorker = new Worker(new URL("./liq-zoom.worker.ts", import.meta.url), { type: "module" });
  }
  return zoomWorker;
}

function zoneShort(d: Date) {
  try {
    return (
      new Intl.DateTimeFormat("es-UY", { timeZoneName: "short" })
        .formatToParts(d)
        .find((p) => p.type === "timeZoneName")?.value || ""
    );
  } catch {
    return "";
  }
}

function tickTime(t: number, span: number) {
  const d = new Date(t);
  if (span <= 86_400_000 * 1.2) {
    const clock = d.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
    const zone = zoneShort(d);
    return zone ? `${clock} ${zone}` : clock;
  }
  if (span <= 86_400_000 * 10) {
    return d.toLocaleDateString("es-UY", { weekday: "short", day: "numeric" });
  }
  if (span <= 86_400_000 * 120) {
    return d.toLocaleDateString("es-UY", { day: "numeric", month: "short" });
  }
  return d.toLocaleDateString("es-UY", { month: "short", year: "numeric" });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ddmmyyyy(t: number) {
  const d = new Date(t);
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function cursorDate(t: number, span: number) {
  const date = ddmmyyyy(t);
  if (span <= 86_400_000 * 40) {
    const d = new Date(t);
    const zone = zoneShort(d);
    return `${date} ${pad2(d.getHours())}:${pad2(d.getMinutes())}${zone ? ` ${zone}` : ""}`;
  }
  return date;
}

function axisUsd(v: number) {
  if (v >= 1_000_000) {
    return `${(v / 1_000_000).toLocaleString("es-UY", { maximumFractionDigits: 2 })} M`;
  }
  if (v >= 100) return Math.round(v).toLocaleString("es-UY");
  if (v >= 1) {
    return v.toLocaleString("es-UY", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }
  return v.toLocaleString("es-UY", { maximumFractionDigits: 4 });
}

function compactUsd(v: number) {
  return axisUsd(v);
}

function kindColor(kind: ReturnType<typeof candleKind>) {
  if (kind === "bull") return "var(--color-long)";
  if (kind === "bear") return "var(--color-short)";
  return "var(--color-doji)";
}

function _heatFill(t: number) {
  const c = Math.max(0, Math.min(1, t));
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [t1, col1] = HEAT_STOPS[i]!;
    const [t0, col0] = HEAT_STOPS[i - 1]!;
    if (c <= t1) {
      const k = (c - t0) / Math.max(t1 - t0, 1e-6);
      return `color-mix(in oklab, ${col1} ${Math.round(k * 100)}%, ${col0})`;
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1]![1];
}

function _robustPeak(values: number[]) {
  const xs = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (xs.length === 0) return 1;
  const p98 = xs[Math.floor((xs.length - 1) * 0.98)]!;
  const hi = xs[xs.length - 1]!;
  return Math.max(p98, hi * 0.4, 1e-9);
}

function heatT(value: number, peak: number) {
  const u = Math.min(1, Math.max(0, value / peak));
  return Math.log1p(14 * u) / Math.log1p(14);
}

function smoothSegment(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0]!.x} ${pts[0]!.y}`;
  if (pts.length === 2) {
    return `M${pts[0]!.x} ${pts[0]!.y} L${pts[1]!.x} ${pts[1]!.y}`;
  }
  const t = 0.2;
  let d = `M${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

function linePath(
  xs: number[],
  ys: (number | null)[],
  xOf: (t: number) => number,
  yOf: (p: number) => number,
) {
  const segs: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  for (let i = 0; i < xs.length; i++) {
    const v = ys[i];
    if (v == null || v <= 0) {
      if (cur.length) {
        segs.push(cur);
        cur = [];
      }
      continue;
    }
    cur.push({ x: xOf(xs[i]!), y: yOf(v) });
  }
  if (cur.length) segs.push(cur);
  return segs.map(smoothSegment).filter(Boolean).join(" ");
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

function px(n: number) {
  return Math.round(n * 2) / 2;
}

type View = { t0: number; t1: number };

function dataExtent(candles: Candle[]): View {
  const n = candles.length;
  if (n < 2) return { t0: 0, t1: 1 };
  return { t0: candles[0]!.t, t1: candles[n - 1]!.t };
}

function clampView(t0: number, t1: number, minSpan: number, data: View): View {
  let span = Math.max(t1 - t0, minSpan);
  const maxSpan = Math.max(data.t1 - data.t0, minSpan);
  if (span > maxSpan) span = maxSpan;
  let a = t0;
  if (a < data.t0) a = data.t0;
  if (a + span > data.t1) a = data.t1 - span;
  return { t0: a, t1: a + span };
}

function zoomAround(
  view: View,
  anchor: number,
  factor: number,
  minSpan: number,
  data: View,
): View {
  const span = Math.max(view.t1 - view.t0, 1);
  const full = Math.max(data.t1 - data.t0, 1);
  if (factor > 1 && span * factor >= 0.42 * full) return { t0: data.t0, t1: data.t1 };
  const abs = view.t0 + Math.min(1, Math.max(0, anchor)) * span;
  const next = span * factor;
  return clampView(abs - anchor * next, abs + (1 - anchor) * next, minSpan, data);
}

function viewForRange(candles: Candle[], lookbackMs: number): View {
  const data = dataExtent(candles);
  const t1 = data.t1;
  return clampView(t1 - lookbackMs, t1, Math.min(lookbackMs, 3_600_000), data);
}

const TF_STEPS = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  4 * 60 * 60_000,
  86_400_000,
  7 * 86_400_000,
];

function _pickStep(span: number, maxBars: number, medianDt: number, maxDt: number) {
  const day = 86_400_000;
  if (span >= 70 * day && span <= 420 * day) return day;
  let minStep = Math.max(medianDt * 0.7, 60_000);
  if (maxDt > 8 * Math.max(medianDt, 1) && maxDt >= 12 * 60 * 60_000) {
    minStep = Math.max(minStep, day);
  }
  const cap = Math.max(maxBars * 1.5, 64);
  let best = TF_STEPS[TF_STEPS.length - 1]!;
  for (const s of TF_STEPS) {
    if (s < minStep * 0.45) continue;
    if (span / s <= cap) {
      best = s;
      break;
    }
  }
  return best;
}

/** Agrega a intervalos de tiempo iguales. No mezcla 15m con diarias en un mismo bucket indexado. */
function _resampleTime(candles: Candle[], t0: number, t1: number, step: number): Candle[] {
  const n = candles.length;
  if (n === 0 || step <= 0) return [];
  if (n <= 3) return candles;
  const start = Math.floor(t0 / step) * step;
  const out: Candle[] = [];
  let i = 0;
  while (i < n && candles[i]!.t < start) i += 1;
  let prevClose = i > 0 ? candles[i - 1]!.close : candles[0]!.close;
  const fillEmpty = step >= 86_400_000;
  for (let bucket = start; bucket <= t1; bucket += step) {
    const end = bucket + step;
    let any = false;
    let open = 0;
    let high = -Infinity;
    let low = Infinity;
    let close = 0;
    let volume = 0;
    while (i < n && candles[i]!.t < end) {
      const c = candles[i]!;
      if (c.t >= bucket && c.open > 0) {
        if (!any) {
          open = c.open;
          any = true;
        }
        if (c.high > high) high = c.high;
        if (c.low < low) low = c.low;
        close = c.close;
        volume += c.volume;
      }
      i += 1;
    }
    if (any && high > 0 && low > 0 && close > 0) {
      out.push({
        t: Math.min(end, t1 + step),
        open,
        high,
        low,
        close,
        volume,
      });
      prevClose = close;
    } else if (fillEmpty && prevClose > 0) {
      out.push({
        t: Math.min(end, t1 + step),
        open: prevClose,
        high: prevClose,
        low: prevClose,
        close: prevClose,
        volume: 0,
      });
    }
  }
  if (out.length >= 2) return out;
  return candles.filter((c) => c.t >= t0 && c.t <= t1);
}

function takeTicks<T>(xs: T[], n: number): T[] {
  if (xs.length <= n) return xs;
  if (n <= 1) return xs.slice(0, 1);
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(xs[Math.round((i * (xs.length - 1)) / (n - 1))]!);
  return out;
}

function sampleEma(src: Candle[], values: (number | null)[], dest: Candle[]) {
  if (src.length === dest.length) return values;
  const out: (number | null)[] = [];
  let j = 0;
  for (const c of dest) {
    while (j + 1 < src.length && src[j + 1]!.t <= c.t) j += 1;
    out.push(values[j] ?? null);
  }
  return out;
}

export function PriceChart({
  market,
  enabled,
  heatOn = true,
  summary = "",
}: {
  market: MarketPayload;
  enabled: Record<MaKey, boolean>;
  heatOn?: boolean;
  summary?: string;
}) {
  const t = useT();
  const sumId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [lite, setLite] = useState(false);
  const [frame, setFrame] = useState({ w: 800, h: 430 });
  const [hover, setHover] = useState<number | null>(null);
  const [liqHover, setLiqHover] = useState<number | null>(null);
  const [cross, setCross] = useState<{ x: number; y: number } | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [heatTick, setHeatTick] = useState(0);
  const home = useMemo(
    () => viewForRange(market.candles, market.lookbackMs || 7 * 86_400_000),
    [market.candles, market.lookbackMs],
  );
  const activeView = view ?? home;
  const viewRef = useRef(activeView);
  viewRef.current = activeView;
  const dragRef = useRef<{ x: number; t0: number; t1: number } | null>(null);
  const pinchRef = useRef<{ dist: number; view: View } | null>(null);
  const pointersRef = useRef(new Map<number, number>());

  useEffect(() => {
    setView(null);
  }, [market.lookbackMs]);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setLite(coarse || slowNet());
  }, []);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const read = () => {
      const w = Math.max(280, Math.round(node.clientWidth) || 280);
      const h = Math.max(240, Math.round(node.clientHeight) || 240);
      setFrame((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const heatCache = useRef<{
    key: string;
    map: { heatmap: HeatBucket[]; clusters: MarketPayload["clusters"]; min: number; max: number };
    heatCols: HeatBucket[];
    peak: number;
    poc: { price: number; long: number; short: number; v: number } | null;
  } | null>(null);
  const heatCv = useRef<HTMLCanvasElement>(null);
  const plotCv = useRef<HTMLCanvasElement>(null);
  const paintedHeat = useRef("");

  const layout = useMemo(() => {
    const all = market.candles;
    const nAll = all.length;
    const data = dataExtent(all);
    const step = TF_SPEC[market.tf ?? "1w"].stepMs;
    const minSpan = step * 4;
    let i0 = 0;
    let i1 = nAll - 1;
    for (let i = 0; i < nAll; i++) {
      if (all[i]!.t >= activeView.t0) {
        i0 = i;
        break;
      }
    }
    for (let i = nAll - 1; i >= 0; i--) {
      if (all[i]!.t <= activeView.t1) {
        i1 = i;
        break;
      }
    }
    if (i1 <= i0) i1 = Math.min(nAll - 1, i0 + 1);
    while (i0 > 0 && all[i0]!.t > activeView.t0) i0 -= 1;
    while (i1 < nAll - 1 && all[i1]!.t < activeView.t1) i1 += 1;
    const raw = all.slice(i0, i1 + 1);
    const vbW = frame.w;
    const vbH = frame.h;
    const slim = vbW < 540;
    const heatW = heatOn ? (slim ? 30 : 48) : 0;
    const labelW = slim ? 58 : 72;
    const plotW = Math.max(120, vbW - PAD.l - heatW - labelW - GAP);
    const t0 = activeView.t0;
    const t1 = activeView.t1;
    const span = Math.max(t1 - t0, 1);
    const candles = raw.filter((c) => c.t >= t0 - span * 0.02 && c.t <= t1 + span * 0.02);
    const n = candles.length;
    const heatX = PAD.l + plotW + GAP;
    const mainH = Math.max(120, vbH - PAD.t - PAD.b - PAD.vol);
    const nativeDts: number[] = [];
    for (let i = 1; i < n; i++) nativeDts.push(candles[i]!.t - candles[i - 1]!.t);
    const medianDt = median(nativeDts.filter((d) => d > 0)) || span / Math.max(n, 8);
    const packed = plotW / Math.max(n, 1);
    const timeSlot = (medianDt / span) * plotW;
    const slot = Math.max(3.6, Math.min(18, timeSlot * 0.88, packed * 0.86));
    const bodyW = Math.max(3, Math.min(heatOn ? 10 : 13, slot * (heatOn ? 0.64 : 0.76)));

    const lastClose = candles[n - 1]?.close ?? market.price;
    let pMin: number;
    let pMax: number;
    if (heatOn) {
      const env = liquidationEnvelope(candles, lastClose);
      pMin = env.min;
      pMax = env.max;
      if (market.poc && market.poc > 0) {
        pMin = Math.min(pMin, market.poc * 0.99);
        pMax = Math.max(pMax, market.poc * 1.01);
      }
    } else {
      pMin = Infinity;
      pMax = -Infinity;
      for (const c of candles) {
        if (c.low < pMin) pMin = c.low;
        if (c.high > pMax) pMax = c.high;
      }
      const pad = Math.max((pMax - pMin) * 0.04, lastClose * 0.004);
      pMin = Math.max(pMin - pad, 1e-6);
      pMax = pMax + pad;
    }
    if (!Number.isFinite(pMin) || !Number.isFinite(pMax) || pMax <= 0) {
      pMin = 1;
      pMax = 2;
    }
    const useLog = pMax / Math.max(pMin, 1e-6) >= 1.8;
    if (useLog) {
      const lr = Math.log(pMax) - Math.log(Math.max(pMin, 1e-6));
      pMin = Math.exp(Math.log(Math.max(pMin, 1e-6)) - lr * 0.03);
      pMax = Math.exp(Math.log(pMax) + lr * 0.03);
    }

    const xOf = (t: number) => px(PAD.l + ((t - t0) / span) * plotW);
    const yOf = (p: number) => {
      if (useLog) {
        const lp = Math.log(Math.max(p, 1e-6));
        const a = Math.log(pMin);
        const b = Math.log(pMax);
        return px(PAD.t + ((b - lp) / Math.max(b - a, 1e-6)) * mainH);
      }
      return px(PAD.t + ((pMax - p) / Math.max(pMax - pMin, 1e-6)) * mainH);
    };
    const priceFromY = (y: number) => {
      const t = (y - PAD.t) / Math.max(mainH, 1);
      if (useLog) {
        const a = Math.log(pMin);
        const b = Math.log(pMax);
        return Math.exp(b - t * (b - a));
      }
      return pMax - t * (pMax - pMin);
    };
    const maxVol = Math.max(...candles.map((c) => c.volume), 1);
    const volTop = PAD.t + mainH + 8;
    const volH = PAD.vol - 14;
    const rangeHome = viewForRange(all, market.lookbackMs);
    const atHome =
      view == null ||
      (Math.abs(activeView.t0 - rangeHome.t0) < span * 0.04 &&
        Math.abs(activeView.t1 - rangeHome.t1) < span * 0.04);

    const bins = Math.max(72, Math.min(128, Math.round(mainH / 3.2)));
    const maxCols = Math.max(48, Math.min(96, Math.round(plotW / 7)));
    const heatKey = heatOn
      ? [
          t0,
          t1,
          Math.round(pMin),
          Math.round(pMax),
          bins,
          maxCols,
          atHome ? "home" : "zoom",
          market.heatmap.length,
        ].join(":")
      : `off:${t0}:${t1}`;

    let heatCols: HeatBucket[] = [];
    let clusters = market.clusters;
    let peak = 1e-9;
    let zoomJob: ZoomJob | null = null;
    if (heatOn) {
      const cached = heatCache.current?.key === heatKey ? heatCache.current : null;
      if (cached) {
        heatCols = cached.heatCols;
        peak = cached.peak;
        clusters = cached.map.clusters;
      } else if (atHome && market.heatmap.length >= 8) {
        heatCols = market.heatmap;
        clusters = market.clusters;
        for (const c of clusters) {
          const v = c.long + c.short;
          if (v > peak) peak = v;
        }
        peak = Math.max(peak * 0.92, 1e-9);
        heatCache.current = {
          key: heatKey,
          map: { heatmap: heatCols, clusters, min: pMin, max: pMax },
          heatCols,
          peak,
          poc: null,
        };
      } else {
        const prev = heatCache.current;
        if (prev) {
          heatCols = prev.heatCols;
          peak = prev.peak;
          clusters = prev.map.clusters;
        }
        zoomJob = {
          key: heatKey,
          candles: all.slice(Math.max(0, i0 - 24), i1 + 1),
          bins,
          maxCols,
          min: pMin,
          max: pMax,
          t0,
          t1,
        };
      }
    }

    const weeklyPoc = market.poc && market.poc > 0 ? market.poc : null;
    const pocCluster =
      weeklyPoc == null
        ? null
        : {
            price: weeklyPoc,
            long: 1,
            short: 1,
            v: 1,
          };
    const emaRaw = {
      ema1d: market.ema1d.slice(i0, i1 + 1),
      ema1w: market.ema1w.slice(i0, i1 + 1),
      ema1m: market.ema1m.slice(i0, i1 + 1),
      ema6m: market.ema6m.slice(i0, i1 + 1),
    };
    const ma = {
      ema1d: sampleEma(raw, emaRaw.ema1d, candles),
      ema1w: sampleEma(raw, emaRaw.ema1w, candles),
      ema1m: sampleEma(raw, emaRaw.ema1m, candles),
      ema6m: sampleEma(raw, emaRaw.ema6m, candles),
    };

    return {
      candles,
      n,
      nAll,
      minSpan,
      data,
      t0,
      t1,
      span,
      vbW,
      vbH,
      plotW,
      heatX,
      heatW,
      labelW,
      mainH,
      slot,
      bodyW,
      pMin,
      pMax,
      useLog,
      xOf,
      yOf,
      priceFromY,
      maxVol,
      volTop,
      volH,
      peak,
      ma,
      heatCols,
      clusters,
      heatKey,
      heatOn,
      poc: pocCluster,
      home: rangeHome,
      atHome,
      zoomed: !atHome,
      zoomJob,
    };
  }, [market, activeView, view, frame.w, frame.h, heatOn, heatTick]);

  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  useEffect(() => {
    const job = layout.zoomJob;
    if (!job || typeof Worker === "undefined") return;
    let worker: Worker;
    try {
      worker = liqZoomWorker();
    } catch {
      return;
    }
    let dead = false;
    const onMsg = (ev: MessageEvent<{ key?: string; heatCols?: HeatBucket[]; peak?: number; map?: { heatmap: HeatBucket[]; clusters: MarketPayload["clusters"]; min: number; max: number } }>) => {
      const data = ev.data;
      if (dead || data?.key !== job.key || !data.heatCols || !data.map) return;
      heatCache.current = {
        key: job.key,
        map: data.map,
        heatCols: data.heatCols,
        peak: data.peak || 1e-9,
        poc: null,
      };
      setHeatTick((n) => n + 1);
    };
    worker.addEventListener("message", onMsg);
    const timer = window.setTimeout(() => {
      if (!dead) worker.postMessage(job);
    }, 60);
    return () => {
      dead = true;
      window.clearTimeout(timer);
      worker.removeEventListener("message", onMsg);
    };
  }, [layout.zoomJob]);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const onWheel = (ev: WheelEvent) => {
      if (document.activeElement !== node) return;
      ev.preventDefault();
      const lay = layoutRef.current;
      if (lay.nAll < 4) return;
      const rect = node.getBoundingClientRect();
      const pxv = ((ev.clientX - rect.left) / rect.width) * lay.vbW;
      const rel = Math.min(1, Math.max(0, (pxv - PAD.l) / lay.plotW));
      const factor = ev.deltaY > 0 ? 1.4 : 1 / 1.4;
      setView(zoomAround(viewRef.current, rel, factor, lay.minSpan, lay.data));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const applyPan = (clientX: number, origin: { x: number; t0: number; t1: number }) => {
    const node = wrapRef.current;
    const lay = layoutRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const dx = ((clientX - origin.x) / rect.width) * lay.vbW;
    const shift = (dx / lay.plotW) * (origin.t1 - origin.t0);
    setView(clampView(origin.t0 - shift, origin.t1 - shift, lay.minSpan, lay.data));
  };

  const onPointerDown = (ev: PointerEvent<SVGSVGElement>) => {
    try {
      ev.currentTarget.setPointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
    pointersRef.current.set(ev.pointerId, ev.clientX);
    const pts = [...pointersRef.current.values()];
    if (pts.length >= 2) {
      dragRef.current = null;
      pinchRef.current = {
        dist: Math.abs(pts[0]! - pts[1]!),
        view: viewRef.current,
      };
      return;
    }
    dragRef.current = { x: ev.clientX, t0: viewRef.current.t0, t1: viewRef.current.t1 };
  };

  const onMove = (ev: PointerEvent<SVGSVGElement>) => {
    if (pointersRef.current.has(ev.pointerId)) {
      pointersRef.current.set(ev.pointerId, ev.clientX);
    }
    const pts = [...pointersRef.current.values()];
    if (pts.length >= 2 && pinchRef.current) {
      const dist = Math.abs(pts[0]! - pts[1]!);
      const base = pinchRef.current.dist || 1;
      const factor = Math.min(2.5, Math.max(0.4, base / Math.max(dist, 1)));
      setView(zoomAround(pinchRef.current.view, 0.5, factor, layoutRef.current.minSpan, layoutRef.current.data));
      return;
    }
    if (dragRef.current && Math.abs(ev.clientX - dragRef.current.x) > 4) {
      applyPan(ev.clientX, dragRef.current);
    }
    const node = wrapRef.current;
    if (!node || layout.n === 0) return;
    const rect = node.getBoundingClientRect();
    const pxv = ((ev.clientX - rect.left) / rect.width) * layout.vbW;
    const py = ((ev.clientY - rect.top) / rect.height) * layout.vbH;
    setCross({ x: pxv, y: py });
    if (!layout.heatOn || layout.clusters.length === 0) {
      setLiqHover(null);
    } else {
      const price = layout.priceFromY(py);
      let best = 0;
      let dist = Infinity;
      layout.clusters.forEach((c, i) => {
        const d = Math.abs(c.price - price);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      setLiqHover(best);
    }
    if (pxv < layout.heatX) {
      let hi = 0;
      let hd = Infinity;
      for (let i = 0; i < layout.n; i++) {
        const d = Math.abs(layout.xOf(layout.candles[i]!.t) - pxv);
        if (d < hd) {
          hd = d;
          hi = i;
        }
      }
      setHover(hi);
    } else {
      setHover(null);
    }
  };

  const onPointerUp = (ev: PointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(ev.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    dragRef.current = null;
  };

  const zoomBy = (factor: number) => {
    setView(zoomAround(viewRef.current, 0.5, factor, layout.minSpan, layout.data));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const lay = layoutRef.current;
    if (!lay) return;
    const v = viewRef.current;
    const span = Math.max(v.t1 - v.t0, 1);
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setView(clampView(v.t0 - 0.2 * span, v.t1 - 0.2 * span, lay.minSpan, lay.data));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setView(clampView(v.t0 + 0.2 * span, v.t1 + 0.2 * span, lay.minSpan, lay.data));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomBy(1 / 2);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomBy(2);
    } else if (e.key === "Home" || e.key === "Escape") {
      e.preventDefault();
      setView(null);
    }
  };

  const hi = hover;
  const hc = hi != null ? layout.candles[hi] : null;
  const hk = hc ? candleKind(hc) : null;
  const liq = liqHover != null ? layout.clusters[liqHover] : null;
  const slim = layout.vbW < 540;
  const ticks = takeTicks(axisTicks(layout.pMin, layout.pMax, slim ? 3 : 7), slim ? 3 : 7);
  const timeTicks = takeTicks(niceTimeTicks(layout.t0, layout.t1, slim ? 3 : 8), slim ? 3 : 8);
  const priceY = layout.yOf(market.price);

  const cursor = (() => {
    if (!cross) return null;
    const y = Math.min(PAD.t + layout.mainH, Math.max(PAD.t, cross.y));
    const inPlot =
      cross.x >= PAD.l &&
      cross.x <= PAD.l + layout.plotW &&
      cross.y >= PAD.t &&
      cross.y <= PAD.t + layout.mainH;
    const inHeat =
      cross.x >= layout.heatX &&
      cross.x <= layout.heatX + layout.heatW &&
      cross.y >= PAD.t &&
      cross.y <= PAD.t + layout.mainH;
    if (!inPlot && !inHeat) return null;
    const x = hc
      ? layout.xOf(hc.t)
      : Math.min(PAD.l + layout.plotW, Math.max(PAD.l, cross.x));
    const price = layout.priceFromY(y);
    const t = hc?.t ?? layout.t0 + ((x - PAD.l) / Math.max(layout.plotW, 1)) * layout.span;
    return { x, y, price, t, showDate: inPlot };
  })();

  const lastC = layout.candles[layout.n - 1];
  const lastKind = lastC ? candleKind(lastC) : null;
  const liveKind =
    lastKind && !isDojiKind(lastKind) ? lastKind : market.change24h >= 0 ? "bull" : "bear";
  const liveColor = kindColor(liveKind);
  const liveY = Math.min(PAD.t + layout.mainH - 14, Math.max(PAD.t + 14, priceY));
  const emaGuard = slim
    ? []
    : MA_META.flatMap((m) => {
        if (!enabled[m.key]) return [];
        const v = lastMaValue(layout.ma[m.key]);
        return v == null ? [] : [layout.yOf(v)];
      });

  useLayoutEffect(() => {
    const heat = heatCv.current;
    const plot = plotCv.current;
    if (!heat || !plot) return;
    for (const cv of [heat, plot]) {
      if (cv.width !== layout.vbW || cv.height !== layout.vbH) {
        cv.width = layout.vbW;
        cv.height = layout.vbH;
      }
    }
    if (layout.heatOn) {
      if (paintedHeat.current !== layout.heatKey) {
        paintHeat(heat, layout);
        paintedHeat.current = layout.heatKey;
      }
    } else if (paintedHeat.current !== layout.heatKey) {
      const ctx = heat.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, layout.vbW, layout.vbH);
        ctx.fillStyle = "#140826";
        ctx.fillRect(PAD.l, PAD.t, layout.plotW, layout.mainH);
      }
      paintedHeat.current = layout.heatKey;
    }
    paintPlot(plot, layout);
  }, [layout]);

  return (
    <div
      className="bit-stage relative overflow-hidden outline-none"
      ref={wrapRef}
      tabIndex={0}
      title={t("zoomNeedFocus")}
      aria-label={t("chartKeys")}
      aria-describedby={sumId}
      onKeyDown={onKeyDown}
      onPointerDown={() => wrapRef.current?.focus({ preventScroll: true })}
    >
      <p id={sumId} className="sr-only">{summary ? `${summary} ${t("chartDisclaimer")}` : t("chartDisclaimer")}</p>
      <div className="absolute top-2 left-2 z-10 flex gap-1">
        <Button
          type="button"
          size="icon"
          variant="subtle"
          className="size-8 min-h-6 min-w-6"
          aria-label={t("zoomOut")}
          onClick={() => zoomBy(2)}
        >
          <ZoomOut />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="subtle"
          className="size-8 min-h-6 min-w-6"
          aria-label={t("zoomIn")}
          onClick={() => zoomBy(1 / 2)}
        >
          <ZoomIn />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="subtle"
          className="size-8 min-h-6 min-w-6"
          aria-label={t("zoomHome")}
          disabled={layout.atHome}
          onClick={() => {
            setView(null);
          }}
        >
          <Maximize2 />
        </Button>
      </div>
      <canvas
        ref={heatCv}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
      <canvas
        ref={plotCv}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
      <svg
        viewBox={`0 0 ${layout.vbW} ${layout.vbH}`}
        className="absolute inset-0 h-full w-full cursor-grab touch-none bg-transparent active:cursor-grabbing"
        role="img"
        aria-label={t("chartAria")}
        onPointerDown={onPointerDown}
        onPointerMove={onMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => {
          setView(null);
        }}
        onPointerLeave={() => {
          setHover(null);
          setLiqHover(null);
          setCross(null);
        }}
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id="velar-plot">
            <rect x={PAD.l} y={PAD.t} width={layout.plotW} height={layout.mainH} />
          </clipPath>
          <clipPath id="velar-heat">
            <rect x={layout.heatX} y={PAD.t} width={layout.heatW} height={layout.mainH} />
          </clipPath>
          <linearGradient id="liq-scale" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1a0a32" />
            <stop offset="22%" stopColor="#3b1480" />
            <stop offset="42%" stopColor="#147d9c" />
            <stop offset="62%" stopColor="#1ed4a0" />
            <stop offset="82%" stopColor="#d4f04a" />
            <stop offset="100%" stopColor="#ffff8a" />
          </linearGradient>
          <filter id="velar-neon" x="-40%" y="-250%" width="180%" height="600%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="ema-neon" x="-18%" y="-70%" width="136%" height="240%">
            <feGaussianBlur stdDeviation="1.15" result="g" />
            <feColorMatrix
              in="g"
              type="matrix"
              values="1 0.32 0 0 0.08
                      0.38 0.38 0 0 0.04
                      0 0.08 0.02 0 0
                      0 0 0 1 0"
              result="fluor"
            />
            <feMerge>
              <feMergeNode in="fluor" />
              <feMergeNode in="fluor" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x={4}
          y={PAD.t}
          width={8}
          height={layout.mainH}
          rx={2}
          fill="url(#liq-scale)"
          opacity={layout.heatOn ? 1 : 0}
        />

        {ticks.map((p) => {
          const y = layout.yOf(p);
          const blocked = [liveY, ...emaGuard].some((b) => Math.abs(b - y) < 18);
          const inPad = y > PAD.t + 10 && y < PAD.t + layout.mainH - 10;
          return (
            <g key={p}>
              <line
                x1={PAD.l}
                x2={PAD.l + layout.plotW}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="2 10"
                opacity={0.7}
                vectorEffect="non-scaling-stroke"
              />
              {inPad && !blocked ? (
                <text
                  x={layout.vbW - 8}
                  y={y}
                  fill="var(--color-muted-foreground)"
                  fontSize="12"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {layout.useLog ? compactUsd(p) : axisUsd(p)}
                </text>
              ) : null}
            </g>
          );
        })}

        <g clipPath="url(#velar-plot)">
          {MA_META.map((m) => {
            if (!enabled[m.key]) return null;
            const d = linePath(
              layout.candles.map((c) => c.t),
              layout.ma[m.key],
              layout.xOf,
              layout.yOf,
            );
            if (!d) return null;
            const tight = Math.min(1, Math.max(0, (layout.slot - 4) / 12));
            const slimMa = layout.vbW < 540;
            const glowW = slimMa ? 0 : 2.1 + (1 - tight) * 1.1;
            const haloW = slimMa ? 0 : 1.35 + (1 - tight) * 0.45;
            const coreW = slimMa ? 1 : m.key === "ema6m" ? 1.22 + (1 - tight) * 0.18 : m.width;
            const glowOp = 0.22 + (1 - tight) * 0.12;
            return (
              <g key={m.key} filter={!lite && !slimMa && m.key === "ema6m" && tight < 0.55 ? "url(#ema-neon)" : undefined}>
                {!slimMa && m.key === "ema6m" ? (
                  <>
                    <path
                      d={d}
                      fill="none"
                      stroke="#ff9a2a"
                      strokeWidth={glowW}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={glowOp}
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d={d}
                      fill="none"
                      stroke="#f7931a"
                      strokeWidth={haloW}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.55}
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                ) : null}
                <path
                  d={d}
                  fill="none"
                  stroke="var(--color-plot)"
                  strokeWidth={coreW + 0.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.65}
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={m.color}
                  strokeWidth={coreW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </g>

        <g clipPath="url(#velar-heat)">
          {layout.heatOn ? (
          <HeatRail
            clusters={layout.clusters}
            yOf={layout.yOf}
            heatX={layout.heatX}
            heatW={layout.heatW}
            pMin={layout.pMin}
            pMax={layout.pMax}
            maxCluster={layout.peak}
            mainH={layout.mainH}
            price={market.price}
            pocPrice={layout.poc?.price ?? null}
            active={liqHover}
          />
          ) : null}
        </g>

        {slim ? null : (
        <MaEndLabels
          enabled={enabled}
          ma={layout.ma}
          yOf={layout.yOf}
          xFrom={PAD.l + layout.plotW}
          mainH={layout.mainH}
          priceY={priceY}
          vbW={layout.vbW}
          labelW={layout.labelW}
        />
        )}

        <line
          x1={layout.heatX}
          x2={layout.heatX}
          y1={PAD.t}
          y2={PAD.t + layout.mainH}
          stroke="rgba(255,255,255,0.18)"
          vectorEffect="non-scaling-stroke"
        />

        {layout.candles.map((c) => {
          const x = layout.xOf(c.t);
          const hw = Math.max(layout.bodyW, 24) / 2;
          return (
            <rect
              key={`hit-${c.t}`}
              x={x - hw}
              y={PAD.t}
              width={hw * 2}
              height={layout.mainH}
              fill="transparent"
              pointerEvents="all"
            />
          );
        })}

        {cross && cursor && (
          <CursorAxes
            x={cursor.x}
            y={cursor.y}
            price={cursor.price}
            time={cursor.t}
            span={layout.span}
            showDate={cursor.showDate}
            heatX={layout.heatX}
            heatW={layout.heatW}
            mainH={layout.mainH}
            vbW={layout.vbW}
            vbH={layout.vbH}
            labelW={layout.labelW}
          />
        )}

        {timeTicks.map((t, i) => (
          <text
            key={t}
            x={Math.min(PAD.l + layout.plotW - 4, Math.max(PAD.l + 4, layout.xOf(t)))}
            y={layout.vbH - 8}
            fill="var(--color-muted-foreground)"
            fontSize="12"
            textAnchor={i === 0 ? "start" : i === timeTicks.length - 1 ? "end" : "middle"}
          >
            {tickTime(t, layout.span)}
          </text>
        ))}

        <LivePriceMark
          price={market.price}
          y={liveY}
          color={liveColor}
          lastX={lastC ? layout.xOf(lastC.t) : PAD.l + layout.plotW}
          vbW={layout.vbW}
          labelW={layout.labelW}
        />

        {layout.poc && layout.poc.v > 0 ? (
          <NeonPocPointer
            cluster={layout.poc}
            yOf={layout.yOf}
            heatX={layout.heatX}
            mainH={layout.mainH}
            liveY={liveY}
            lite={lite}
          />
        ) : null}
      </svg>

      {hc && hk && (
        <div className="pointer-events-none absolute top-12 left-2 max-w-[240px] rounded-md bg-elevated px-2.5 py-1.5 text-sm shadow-[var(--shadow-border)]">
          <p className="text-muted-foreground">
            {cursorDate(hc.t, layout.span)}
          </p>
          <p
            className={cn(
              "mt-1 font-medium",
              isDojiKind(hk) ? "text-doji" : hk === "bull" ? "text-long" : "text-short",
            )}
          >
            {t(
              ({ bull: "kindBull", bear: "kindBear", doji: "kindDoji", dragonfly: "kindDragon", gravestone: "kindGrave" } as const)[
                hk
              ],
            )}
          </p>
          <p className="font-mono tabular-nums text-foreground">
            O {formatUsd(hc.open, 0)} · C {formatUsd(hc.close, 0)}
          </p>
          <p className="font-mono tabular-nums text-muted-foreground">
            H {formatUsd(hc.high, 0)} · L {formatUsd(hc.low, 0)}
          </p>
        </div>
      )}

      {layout.heatOn && liq && (
        <div className="pointer-events-none absolute top-12 right-2 max-w-[200px] rounded-md bg-elevated px-2.5 py-1.5 text-sm shadow-[var(--shadow-border)]">
          <p className="text-muted-foreground">
            {layout.poc && Math.abs(liq.price - layout.poc.price) / layout.poc.price < 0.012
              ? "POC semanal · mayor acumulación"
              : "Acumulación on-chain"}
          </p>
          <p
            className={cn(
              "font-mono tabular-nums",
              layout.poc && Math.abs(liq.price - layout.poc.price) / layout.poc.price < 0.012
                ? "text-primary"
                : "text-heat-5",
            )}
          >
            {formatUsd(liq.price, 0)}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Intensidad {Math.round(heatT(liq.long + liq.short, layout.peak) * 100)}%
          </p>
        </div>
      )}

      <p className="pointer-events-none absolute top-2 right-2 rounded bg-elevated/90 px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-muted-foreground">
        {layout.useLog ? "LOG" : "LIN"} · {market.tf === "1w" ? "1S" : market.tf === "1m" ? "1M" : market.tf === "6m" ? "6M" : "1D"}
        {layout.zoomed ? " · zoom" : ""}
      </p>
      {layout.heatOn && market.liqVenues && market.liqVenues.length >= 2 ? (
        <p
          className="pointer-events-none absolute bottom-8 left-5 max-w-[70%] truncate rounded bg-black/35 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-white/80"
          title={market.liqVenues.join(" · ")}
        >
          {t("liqAvg", { n: market.liqVenues.length })}
        </p>
      ) : null}
    </div>
  );
}

function NeonPocPointer({
  cluster,
  yOf,
  heatX,
  mainH,
  liveY,
  lite,
}: {
  cluster: { price: number; long: number; short: number };
  yOf: (p: number) => number;
  heatX: number;
  mainH: number;
  liveY: number;
  lite: boolean;
}) {
  const y = yOf(cluster.price);
  if (y < PAD.t + 4 || y > PAD.t + mainH - 4) return null;
  const neon = "var(--color-primary)";
  const label = `POC S ${formatUsd(cluster.price, 0)}`;
  const w = Math.min(132, Math.max(86, label.length * 7.2 + 18));
  const labelX = heatX - 10 - w;
  let labelY = y - 12;
  if (Math.abs(labelY - liveY) < 16) labelY = liveY < y ? y + 14 : y - 28;
  labelY = Math.min(PAD.t + mainH - 18, Math.max(PAD.t + 6, labelY));
  const tip = heatX - 1;
  const cx = labelX + w / 2;
  const cy = labelY + 10;

  return (
    <g pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <ellipse
          key={`w-${i}`}
          cx={cx}
          cy={cy}
          fill="none"
          stroke={neon}
          strokeWidth={1.2}
        >
          <animate attributeName="rx" values="10;52" dur="2.4s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
          <animate attributeName="ry" values="6;22" dur="2.4s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0" dur="2.4s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
      {[0, 1, 2].map((i) => (
        <ellipse
          key={`t-${i}`}
          cx={tip - 6}
          cy={y}
          fill="none"
          stroke={neon}
          strokeWidth={1.1}
        >
          <animate attributeName="rx" values="4;28" dur="2.2s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
          <animate attributeName="ry" values="4;16" dur="2.2s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.55;0" dur="2.2s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
      {[0.55, 0.78, 1].map((k, i) => (
        <path
          key={`f-${i}`}
          d={`M ${labelX + w} ${cy} Q ${(labelX + w + tip) / 2} ${cy - 16 - i * 10} ${tip} ${y}
              M ${labelX + w} ${cy} Q ${(labelX + w + tip) / 2} ${cy + 16 + i * 10} ${tip} ${y}`}
          fill="none"
          stroke={neon}
          strokeWidth={1}
          opacity={0.35 - i * 0.08}
          style={{ animation: `poc-magnet 2.6s ${i * 0.35}s ease-out infinite` }}
        />
      ))}
      <g className="velar-neon-glow" filter={lite ? undefined : "url(#velar-neon)"}>
        <line
          x1={PAD.l + (heatX - PAD.l) * 0.58}
          x2={tip}
          y1={y}
          y2={y}
          stroke={neon}
          strokeWidth={1.15}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={PAD.l + (heatX - PAD.l) * 0.58}
          x2={tip}
          y1={y}
          y2={y}
          stroke={neon}
          strokeWidth={4}
          opacity={0.22}
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <rect x={labelX} y={labelY} width={w} height={20} rx={4} fill={neon} />
      <text
        x={labelX + w / 2}
        y={labelY + 10}
        fill="var(--color-primary-foreground)"
        fontSize="11"
        fontWeight="700"
        fontFamily="var(--font-mono)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

function CursorAxes({
  x,
  y,
  price,
  time,
  span,
  showDate,
  heatX,
  heatW,
  mainH,
  vbW,
  vbH,
  labelW,
}: {
  x: number;
  y: number;
  price: number;
  time: number;
  span: number;
  showDate: boolean;
  heatX: number;
  heatW: number;
  mainH: number;
  vbW: number;
  vbH: number;
  labelW: number;
}) {
  const date = cursorDate(time, span);
  const priceLabel = axisUsd(price);
  const dateW = Math.min(170, Math.max(88, date.length * 7.4 + 14));
  const dateX = Math.min(heatX - dateW, Math.max(PAD.l, x - dateW / 2));
  const tagY = Math.min(PAD.t + mainH - 10, Math.max(PAD.t + 10, y));

  return (
    <g pointerEvents="none">
      {showDate && (
        <line
          x1={x}
          x2={x}
          y1={PAD.t}
          y2={PAD.t + mainH}
          stroke="var(--color-foreground)"
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={0.55}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <line
        x1={PAD.l}
        x2={heatX + heatW}
        y1={y}
        y2={y}
        stroke="var(--color-foreground)"
        strokeWidth={1}
        strokeDasharray="3 4"
        opacity={0.55}
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={vbW - labelW + 2}
        y={tagY - 11}
        width={labelW - 6}
        height={22}
        rx={3}
        fill="var(--color-foreground)"
      />
      <text
        x={vbW - 8}
        y={tagY}
        fill="var(--color-background)"
        fontSize="12"
        fontFamily="var(--font-mono)"
        textAnchor="end"
        dominantBaseline="middle"
      >
        {priceLabel}
      </text>
      {showDate && (
        <>
          <rect
            x={dateX}
            y={vbH - 24}
            width={dateW}
            height={20}
            rx={3}
            fill="var(--color-foreground)"
          />
          <text
            x={dateX + dateW / 2}
            y={vbH - 14}
            fill="var(--color-background)"
            fontSize="12"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {date}
          </text>
        </>
      )}
    </g>
  );
}

function liveUsd(v: number) {
  return axisUsd(v);
}

function LivePriceMark({
  price,
  y,
  color,
  lastX,
  vbW,
  labelW,
}: {
  price: number;
  y: number;
  color: string;
  lastX: number;
  vbW: number;
  labelW: number;
}) {
  const x = vbW - labelW + 2;
  const w = labelW - 6;
  return (
    <g pointerEvents="none">
      <line
        x1={PAD.l}
        x2={x}
        y1={y}
        y2={y}
        stroke={color}
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={lastX}
        cy={y}
        r={3.4}
        fill={color}
        stroke="var(--color-background)"
        strokeWidth={1.4}
      />
      <polygon
        points={`${x},${y} ${x - 18},${y - 12} ${x - 18},${y + 12}`}
        fill="#F7931A"
        stroke="#ffffff"
        strokeWidth={0.8}
      />
      <text
        x={x - 10}
        y={y + 0.5}
        fill="#ffffff"
        fontSize="11"
        fontWeight="800"
        fontFamily="var(--font-sans)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ₿
      </text>
      <rect x={x} y={y - 13} width={w} height={26} rx={3} fill={color} />
      <text
        x={x + w - 5}
        y={y}
        fill="var(--color-background)"
        fontSize="13"
        fontWeight="700"
        fontFamily="var(--font-mono)"
        textAnchor="end"
        dominantBaseline="middle"
      >
        {liveUsd(price)}
      </text>
    </g>
  );
}

const HEAT_RGB: [number, [number, number, number, number]][] = [
  [0, [22, 8, 46, 255]],
  [0.14, [58, 18, 128, 255]],
  [0.3, [28, 90, 170, 255]],
  [0.46, [18, 170, 168, 255]],
  [0.62, [48, 220, 120, 255]],
  [0.8, [210, 240, 55, 255]],
  [1, [255, 255, 140, 255]],
];

const HEAT_LUT = (() => {
  const lut = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const [r, g, b, a] = heatRgba(i / 255);
    const o = i * 4;
    lut[o] = r;
    lut[o + 1] = g;
    lut[o + 2] = b;
    lut[o + 3] = a;
  }
  return lut;
})();

let heatOff: HTMLCanvasElement | null = null;
function getHeatOff(w: number, h: number) {
  if (!heatOff) heatOff = document.createElement("canvas");
  if (heatOff.width !== w || heatOff.height !== h) {
    heatOff.width = w;
    heatOff.height = h;
  }
  return heatOff;
}

function paintHeat(
  canvas: HTMLCanvasElement,
  layout: {
    vbW: number;
    vbH: number;
    plotW: number;
    mainH: number;
    heatX: number;
    heatW: number;
    t0: number;
    t1: number;
    peak: number;
    heatCols: HeatBucket[];
    clusters: MarketPayload["clusters"];
    pMin: number;
    pMax: number;
    useLog: boolean;
    yOf: (p: number) => number;
  },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, layout.vbW, layout.vbH);
  ctx.fillStyle = "#140826";
  ctx.fillRect(PAD.l, PAD.t, layout.plotW, layout.mainH);
  ctx.fillStyle = "#1a0a32";
  ctx.fillRect(layout.heatX, PAD.t, layout.heatW, layout.mainH);
  const columns = layout.heatCols;
  const maxCell = layout.peak;
  if (columns.length < 1 || maxCell <= 0) return;

  const nCol = columns.length;
  const h = Math.max(2, Math.round(layout.mainH));
  const nBin = columns[0]!.bins.length;
  const logMin = Math.log(Math.max(layout.pMin, 1e-6));
  const logMax = Math.log(Math.max(layout.pMax, layout.pMin * 1.001));
  const rowBin = new Int16Array(h);
  for (let y = 0; y < h; y++) {
    const t = y / Math.max(h - 1, 1);
    const price = layout.useLog
      ? Math.exp(logMax - t * (logMax - logMin))
      : layout.pMax - t * (layout.pMax - layout.pMin);
    const lp = Math.log(Math.max(price, 1e-6));
    const idx = ((lp - logMin) / Math.max(logMax - logMin, 1e-9)) * nBin;
    rowBin[y] = Math.max(0, Math.min(nBin - 1, idx | 0));
  }

  const img = ctx.createImageData(nCol, h);
  const data = img.data;
  const invLog = 1 / Math.log1p(18);
  for (let x = 0; x < nCol; x++) {
    const col = columns[x]!;
    for (let y = 0; y < h; y++) {
      const b = col.bins[rowBin[y]!]!;
      const u = Math.min(1, Math.max(0, (b.long + b.short) / maxCell));
      const conc = Math.log1p(18 * u) * invLog;
      const li = (conc * 255) | 0;
      const s = li * 4;
      const o = (y * nCol + x) * 4;
      data[o] = HEAT_LUT[s]!;
      data[o + 1] = HEAT_LUT[s + 1]!;
      data[o + 2] = HEAT_LUT[s + 2]!;
      data[o + 3] = 255;
    }
  }
  const off = getHeatOff(nCol, h);
  off.getContext("2d")!.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, PAD.l, PAD.t, layout.plotW, layout.mainH);

  const railW = layout.heatW - 6;
  for (let i = 0; i < layout.clusters.length; i++) {
    const c = layout.clusters[i]!;
    if (c.price < layout.pMin || c.price > layout.pMax) continue;
    const u = Math.min(1, Math.max(0, (c.long + c.short) / maxCell));
    if (u < 0.04) continue;
    const conc = Math.log1p(14 * u) * invLog;
    const y = layout.yOf(c.price);
    const prev = layout.clusters[i - 1];
    const next = layout.clusters[i + 1];
    const y0 = prev ? (layout.yOf(prev.price) + y) / 2 : y - 1;
    const y1 = next ? (y + layout.yOf(next.price)) / 2 : y + 1;
    const top = Math.min(y0, y1);
    const hh = Math.max(1, Math.abs(y1 - y0));
    const li = (conc * 255) | 0;
    const s = li * 4;
    ctx.fillStyle = `rgba(${HEAT_LUT[s]},${HEAT_LUT[s + 1]},${HEAT_LUT[s + 2]},${(HEAT_LUT[s + 3]! / 255) * 1.15})`;
    ctx.fillRect(layout.heatX, top, railW, hh);
  }
}

function paintPlot(
  canvas: HTMLCanvasElement,
  layout: {
    vbW: number;
    vbH: number;
    plotW: number;
    mainH: number;
    candles: Candle[];
    xOf: (t: number) => number;
    yOf: (p: number) => number;
    bodyW: number;
    slot: number;
    maxVol: number;
    volTop: number;
    volH: number;
  },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, layout.vbW, layout.vbH);
  const { candles, xOf, yOf, bodyW, slot, maxVol, volTop, volH, plotW, mainH } = layout;
  ctx.fillStyle = "#10061e";
  ctx.fillRect(PAD.l, volTop, plotW, volH);
  const vw = Math.max(1, Math.min(bodyW, slot * 0.55));
  for (const c of candles) {
    const kind = candleKind(c);
    const color = KIND_HEX[kind] ?? KIND_HEX.doji!;
    const x = xOf(c.t);
    const vh = (c.volume / Math.max(maxVol, 1)) * volH;
    ctx.globalAlpha = isDojiKind(kind) ? 0.45 : 0.55;
    ctx.fillStyle = color;
    ctx.fillRect(x - vw / 2, volTop + volH - vh, vw, Math.max(1, vh));
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(PAD.l, PAD.t, plotW, mainH);
  ctx.clip();
  ctx.globalAlpha = 1;
  for (const c of candles) {
    const kind = candleKind(c);
    const color = KIND_HEX[kind] ?? KIND_HEX.doji!;
    const x = Math.round(xOf(c.t)) + 0.5;
    const yH = yOf(c.high);
    const yL = yOf(c.low);
    const yO = yOf(c.open);
    const yC = yOf(c.close);
    const doji = isDojiKind(kind);
    const w = Math.max(doji ? 3 : 2.8, bodyW);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(x, yH);
    ctx.lineTo(x, yL);
    ctx.stroke();
    if (doji) {
      ctx.fillStyle = "#0a0418";
      ctx.fillRect(x - w / 2 - 1, (yO + yC) / 2 - 1.4, w + 2, 2.8);
      ctx.fillStyle = color;
      ctx.fillRect(x - w / 2, (yO + yC) / 2 - 0.8, w, 1.6);
    } else {
      const top = Math.min(yO, yC);
      const h = Math.max(3, Math.abs(yC - yO));
      ctx.fillStyle = "#0a0418";
      ctx.fillRect(x - w / 2 - 1, top - 1, w + 2, h + 2);
      ctx.fillStyle = color;
      ctx.fillRect(x - w / 2, top, w, h);
    }
  }
  ctx.restore();
}

function heatRgba(t: number): [number, number, number, number] {
  const c = Math.max(0, Math.min(1, t));
  for (let i = 1; i < HEAT_RGB.length; i++) {
    const [t1, col1] = HEAT_RGB[i]!;
    const [t0, col0] = HEAT_RGB[i - 1]!;
    if (c <= t1) {
      const k = (c - t0) / Math.max(t1 - t0, 1e-6);
      return [
        Math.round(col0[0] + (col1[0] - col0[0]) * k),
        Math.round(col0[1] + (col1[1] - col0[1]) * k),
        Math.round(col0[2] + (col1[2] - col0[2]) * k),
        Math.round(col0[3] + (col1[3] - col0[3]) * k),
      ];
    }
  }
  const last = HEAT_RGB[HEAT_RGB.length - 1]![1];
  return last;
}

function HeatRail({
  clusters,
  yOf,
  heatX,
  pMin: _pMin,
  pMax: _pMax,
  maxCluster,
  mainH,
  price,
  pocPrice,
  active: _active,
  heatW,
}: {
  clusters: MarketPayload["clusters"];
  yOf: (p: number) => number;
  heatX: number;
  heatW: number;
  pMin: number;
  pMax: number;
  maxCluster: number;
  mainH: number;
  price: number;
  pocPrice: number | null;
  active: number | null;
}) {
  if (clusters.length === 0 || maxCluster <= 0) return null;

  const localMax = clusters
    .map((c, i) => ({ c, i, v: c.long + c.short }))
    .filter((row, idx, arr) => {
      if (heatT(row.v, maxCluster) < 0.28) return false;
      const prev = arr[idx - 1]?.v ?? 0;
      const next = arr[idx + 1]?.v ?? 0;
      return row.v >= prev && row.v >= next;
    });

  const above = localMax
    .filter((row) => row.c.price > price)
    .filter((row) => pocPrice == null || Math.abs(row.c.price - pocPrice) / pocPrice > 0.008)
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .sort((a, b) => b.c.price - a.c.price);
  const below = localMax
    .filter((row) => row.c.price < price)
    .filter((row) => pocPrice == null || Math.abs(row.c.price - pocPrice) / pocPrice > 0.008)
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .sort((a, b) => b.c.price - a.c.price);

  const spread = (rows: typeof localMax) => {
    const items = rows.map((row) => ({ ...row, y: yOf(row.c.price) }));
    const minG = 18;
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1]!;
      const cur = items[i]!;
      if (cur.y - prev.y < minG) cur.y = prev.y + minG;
    }
    return items;
  };

  const priceY = yOf(price);

  return (
    <g aria-hidden="true">
      <line
        x1={heatX}
        x2={heatX + heatW - 6}
        y1={priceY}
        y2={priceY}
        stroke="var(--color-foreground)"
        strokeWidth={1.1}
        opacity={0.65}
        vectorEffect="non-scaling-stroke"
      />
      <MagnetMarks
        items={spread(above)}
        heatX={heatX}
        heatW={heatW}
        color="var(--color-short)"
        mainH={mainH}
      />
      <MagnetMarks
        items={spread(below)}
        heatX={heatX}
        heatW={heatW}
        color="var(--color-long)"
        mainH={mainH}
      />
    </g>
  );
}

function MagnetMarks({
  items,
  heatX,
  heatW,
  color,
  mainH,
}: {
  items: { c: { price: number }; y: number }[];
  heatX: number;
  heatW: number;
  color: string;
  mainH: number;
}) {
  return (
    <>
      {items.map((row) => {
        const y = Math.min(PAD.t + mainH - 8, Math.max(PAD.t + 8, row.y));
        return (
          <g key={`pk-${row.c.price}`}>
            <line
              x1={heatX}
              x2={heatX + heatW - 6}
              y1={row.y}
              y2={row.y}
              stroke={color}
              strokeWidth={1.2}
              opacity={0.9}
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={heatX + 2}
              y={y - 8}
              width={heatW - 12}
              height={16}
              rx={3}
              fill="var(--color-background)"
              opacity={0.88}
            />
            <text
              x={heatX + (heatW - 6) / 2}
              y={y}
              fill={color}
              fontSize="9"
              fontFamily="var(--font-mono)"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {compactUsd(row.c.price)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function lastMaValue(values: (number | null)[]) {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  }
  return null;
}

function MaEndLabels({
  enabled,
  ma,
  yOf,
  xFrom,
  mainH,
  priceY,
  vbW,
  labelW,
}: {
  enabled: Record<MaKey, boolean>;
  ma: Record<MaKey, (number | null)[]>;
  yOf: (p: number) => number;
  xFrom: number;
  mainH: number;
  priceY: number;
  vbW: number;
  labelW: number;
}) {
  const items = MA_META.flatMap((m) => {
    if (!enabled[m.key]) return [];
    const value = lastMaValue(ma[m.key]);
    if (value == null) return [];
    const yTrue = yOf(value);
    return [{ ...m, value, yTrue, y: yTrue }];
  }).sort((a, b) => a.y - b.y);

  const minGap = 24;
  const top = PAD.t + 12;
  const bot = PAD.t + mainH - 12;
  const reserved = [priceY];
  for (const item of items) {
    for (const r of reserved) {
      if (Math.abs(item.y - r) < minGap) {
        item.y = item.y < r ? r - minGap : r + minGap;
      }
    }
  }
  for (let i = 1; i < items.length; i++) {
    if (items[i]!.y < items[i - 1]!.y + minGap) {
      items[i]!.y = items[i - 1]!.y + minGap;
    }
  }
  if (items.length && items[items.length - 1]!.y > bot) {
    items[items.length - 1]!.y = bot;
    for (let i = items.length - 2; i >= 0; i--) {
      if (items[i]!.y > items[i + 1]!.y - minGap) {
        items[i]!.y = items[i + 1]!.y - minGap;
      }
    }
  }
  if (items.length && items[0]!.y < top) items[0]!.y = top;

  const x = vbW - labelW + 2;
  const w = labelW - 6;
  return (
    <g pointerEvents="none">
      {items.map((m) => (
        <g key={m.key}>
          <line
            x1={xFrom}
            x2={x}
            y1={m.yTrue}
            y2={m.yTrue}
            stroke={m.color}
            strokeWidth={1.15}
            strokeDasharray="4 3"
            opacity={0.85}
            vectorEffect="non-scaling-stroke"
          />
          <rect x={x} y={m.y - 11} width={w} height={22} rx={3} fill={m.color} />
          <text
            x={x + w / 2}
            y={m.y}
            fill="var(--color-background)"
            fontSize="11"
            fontWeight="700"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {axisUsd(m.value)}
          </text>
        </g>
      ))}
    </g>
  );
}

function _VolumeBar({
  c,
  layout,
  active,
}: {
  c: Candle;
  layout: {
    slot: number;
    xOf: (t: number) => number;
    maxVol: number;
    volTop: number;
    volH: number;
  };
  active: boolean;
}) {
  const kind = candleKind(c);
  const h = (c.volume / layout.maxVol) * layout.volH;
  const w = Math.max(1, layout.slot * 0.7);
  return (
    <rect
      x={layout.xOf(c.t) - w / 2}
      y={layout.volTop + layout.volH - h}
      width={w}
      height={Math.max(1, h)}
      fill={kindColor(kind)}
      opacity={active ? 0.9 : isDojiKind(kind) ? 0.7 : 0.32}
    />
  );
}

function _CandleShape({
  c,
  layout,
  active,
}: {
  c: Candle;
  layout: {
    bodyW: number;
    xOf: (t: number) => number;
    yOf: (p: number) => number;
  };
  active: boolean;
}) {
  const kind = candleKind(c);
  const x = layout.xOf(c.t);
  const yH = layout.yOf(c.high);
  const yL = layout.yOf(c.low);
  const yO = layout.yOf(c.open);
  const yC = layout.yOf(c.close);
  const color = kindColor(kind);
  const doji = isDojiKind(kind);
  const bodyTop = Math.min(yO, yC);
  const bodyH = Math.max(doji ? 1.6 : 2.2, Math.abs(yC - yO));
  const w = Math.max(doji ? 2.2 : 1.6, layout.bodyW);
  const mid = (yO + yC) / 2;

  return (
    <g opacity={active ? 1 : 0.98}>
      <line
        x1={x}
        x2={x}
        y1={yH}
        y2={yL}
        stroke={color}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {doji ? (
        <>
          <line
            x1={x - w / 2}
            x2={x + w / 2}
            y1={mid}
            y2={mid}
            stroke={color}
            strokeWidth={1.15}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={x - Math.max(1.1, w * 0.18) / 2}
            y={mid - 0.7}
            width={Math.max(1.1, w * 0.18)}
            height={1.4}
            fill={color}
          />
        </>
      ) : (
        <rect
          x={x - w / 2}
          y={bodyTop}
          width={w}
          height={bodyH}
          fill={color}
          stroke={color}
          strokeWidth={0.55}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
}
