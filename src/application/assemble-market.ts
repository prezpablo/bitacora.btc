import {
  MA_WINDOWS_MS,
  TF_SPEC,
  buildLiquidationMap,
  lastDefined,
  liquidationEnvelope,
  resampleWeekly,
  rollingTimeEma,
  summarizeLiquidations,
  type Candle,
  type ChartRange,
  type HeatBucket,
  type LiqCluster,
  type MarketPayload,
} from "@/domain";
import type { Quote } from "./ports";

export function assembleMarket(
  candles: Candle[],
  quote: Quote,
  lookbackMs: number,
  liqBlend?: { heatmap: HeatBucket[]; clusters: LiqCluster[]; venues: string[] } | null,
  tf: ChartRange = "1w",
): MarketPayload {
  const emaSeries = candles.map((c) => ({ t: c.t, close: c.close }));
  const times = candles.map((c) => c.t);
  const ema1d = rollingTimeEma(emaSeries, times, MA_WINDOWS_MS.ema1d);
  const ema1w = rollingTimeEma(emaSeries, times, MA_WINDOWS_MS.ema1w);
  const ema1m = rollingTimeEma(emaSeries, times, MA_WINDOWS_MS.ema1m);
  const ema6m = rollingTimeEma(emaSeries, times, MA_WINDOWS_MS.ema6m);

  const bars = TF_SPEC[tf].barsHome;
  const src = candles.length > bars ? candles.slice(-bars) : candles;
  const env = liquidationEnvelope(src, quote.price);
  const { heatmap, clusters } = buildLiquidationMap(src, {
    bins: 120,
    maxCols: Math.min(96, Math.max(24, src.length)),
    min: env.min,
    max: env.max,
  });
  const heat = liqBlend && liqBlend.heatmap.length >= 8 ? liqBlend.heatmap : heatmap;
  const book = liqBlend && liqBlend.clusters.length >= 8 ? liqBlend.clusters : clusters;

  const weekly = tf === "1w" || tf === "1m" || tf === "6m" ? src : resampleWeekly(candles);
  const weekSrc = weekly.length > 52 ? weekly.slice(-52) : weekly;
  const weekEnv = liquidationEnvelope(weekSrc.length ? weekSrc : src, quote.price);
  const weekMap = buildLiquidationMap(weekSrc.length >= 8 ? weekSrc : src, {
    bins: 140,
    maxCols: Math.max(24, Math.min(52, weekSrc.length || 52)),
    min: weekEnv.min,
    max: weekEnv.max,
  });
  const { magnets, poc, vaLow, vaHigh } = summarizeLiquidations(weekMap.clusters);

  let longPct = quote.longPct;
  let shortPct = quote.shortPct;
  if (quote.source === "hyperliquid" || (liqBlend && liqBlend.venues.length >= 2)) {
    const l = book.reduce((s, c) => s + c.long, 0);
    const s = book.reduce((s, c) => s + c.short, 0);
    const tot = l + s;
    if (tot > 0) {
      longPct = (l / tot) * 100;
      shortPct = (s / tot) * 100;
    }
  }

  return {
    source: quote.source,
    asOf: Date.now(),
    symbol: "BTC",
    price: quote.price,
    change24h: quote.change24h,
    high24h: quote.high24h,
    low24h: quote.low24h,
    volume24h: quote.volume24h,
    longPct,
    shortPct,
    candles,
    ema1d,
    ema1w,
    ema1m,
    ema6m,
    emaNow: {
      ema1d: lastDefined(ema1d),
      ema1w: lastDefined(ema1w),
      ema1m: lastDefined(ema1m),
      ema6m: lastDefined(ema6m),
    },
    heatmap: heat,
    clusters: book,
    magnets,
    poc,
    vaLow,
    vaHigh,
    priceMin: Math.min(...candles.map((c) => c.low)),
    priceMax: Math.max(...candles.map((c) => c.high)),
    lookbackMs,
    liqVenues: liqBlend?.venues,
    tf,
  };
}
