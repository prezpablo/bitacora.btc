import { RANGE_SPEC, TF_SPEC, resampleToTf, stitchCandles, type ChartRange, type LiqRange, type MarketPayload } from "@/domain";
import { assembleMarket } from "@/application";
import { syntheticCandles, syntheticDailyHistory } from "./synthetic";

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
