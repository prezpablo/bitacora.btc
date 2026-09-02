import { RANGE_SPEC, TF_SPEC, resampleToTf, stitchCandles, type ChartRange, type LiqRange, type MarketPayload } from "@/domain";
import { assembleMarket, loadExtras, loadMarket } from "@/application";
import type { ExtrasFeed } from "@/application";
import {
  fetchClarity,
  fetchFearGreed,
  fetchLiquidity,
  fetchOnchain,
  fetchPulse,
} from "./extra-feeds";
import { withLastKnown } from "./last-known";
import { binanceFeed, hyperliquidFeed, okxFeed } from "./market-feeds";
import { syntheticCandles, syntheticDailyHistory } from "./synthetic";
import { blendExchangeLiquidation, fetchTopExchangeTapes } from "./exchange-liq";

export function buildModelMarket(range: ChartRange, _liq: LiqRange): MarketPayload {
  const now = Date.UTC(2026, 7, 22, 16, 0, 0);
  const lookbackMs = RANGE_SPEC[range].lookback;
  const candles = resampleToTf(
    stitchCandles(syntheticDailyHistory(now), syntheticCandles(range, now)),
    range,
  );
  const last = candles[candles.length - 1]!;
  const dayAgo = candles.find((c) => c.t >= last.t - TF_SPEC[range].stepMs) ?? candles[0]!;
  return assembleMarket(
    candles,
    {
      source: "modelo",
      price: last.close,
      change24h: ((last.close - dayAgo.close) / dayAgo.close) * 100,
      high24h: last.high,
      low24h: last.low,
      volume24h: 5.1e10,
      longPct: 52.82,
      shortPct: 47.18,
    },
    lookbackMs,
    null,
    range,
  );
}

const extrasFeed: ExtrasFeed = {
  onchain: (range) =>
    withLastKnown("onchain", () => fetchOnchain(range), (d) => d.height > 0 || d.hashSeries.length > 0),
  clarity: () => withLastKnown("clarity", fetchClarity, (d) => Number.isFinite(d.yes)),
  fearGreed: () => withLastKnown("fear-greed", fetchFearGreed, (d) => Number.isFinite(d.value)),
  liquidity: () => withLastKnown("liquidity", fetchLiquidity, (d) => d.price > 0),
  pulse: () => withLastKnown("pulse", fetchPulse, (d) => d.news.length > 0 || d.trends.length > 0),
};

export function fetchLiveMarket(range: ChartRange, liq: LiqRange) {
  return loadMarket(range, liq, [binanceFeed, okxFeed, hyperliquidFeed], buildModelMarket, async (r, env, signal) => {
    const tapes = await fetchTopExchangeTapes(r, signal);
    return blendExchangeLiquidation(tapes, env, 96, r);
  });
}

export function fetchDeskExtras(range: ChartRange) {
  return loadExtras(range, extrasFeed);
}

export { fetchTick } from "./tick";
