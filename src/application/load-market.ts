import {
  RANGE_SPEC,
  liquidationEnvelope,
  resampleToTf,
  stitchCandles,
  type ChartRange,
  type LiqRange,
  type MarketPayload,
} from "@/domain";
import { assembleMarket } from "./assemble-market";
import type { LoadLiqBlend, MarketFeed, ModelMarket } from "./ports";

export async function loadMarket(
  range: ChartRange,
  liq: LiqRange,
  feeds: MarketFeed[],
  model: ModelMarket,
  loadLiq?: LoadLiqBlend,
): Promise<MarketPayload> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 22_000);
  try {
    let lastErr: unknown;
    for (const feed of feeds) {
      try {
        const tape = await feed.load(range, ctrl.signal);
        const spec = RANGE_SPEC[range];
        const candles = resampleToTf(stitchCandles(tape.deep, tape.candles), range);
        const last = candles[candles.length - 1] ?? tape.candles[tape.candles.length - 1];
        if (!last) throw new Error("empty tape");
        const heatSrc = candles.length > 8 ? candles : tape.candles;
        const env = liquidationEnvelope(heatSrc, tape.quote.price);
        const liqBlend = loadLiq ? await loadLiq(range, env, ctrl.signal).catch(() => null) : null;
        return assembleMarket(
          candles,
          {
            ...tape.quote,
            high24h: tape.quote.high24h || last.high,
            low24h: tape.quote.low24h || last.low,
          },
          spec.lookback,
          liqBlend,
          range,
        );
      } catch (err) {
        lastErr = err;
      }
    }
    if (lastErr) return model(range, liq);
    return model(range, liq);
  } finally {
    clearTimeout(timer);
  }
}
