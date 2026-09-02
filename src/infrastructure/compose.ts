import { type ChartRange, type LiqRange, type MarketPayload } from "@/domain";
import { loadExtras, loadMarket, buildModelMarket } from "@/application";
import type { ExtrasFeed } from "@/application";
import {
  fetchClarity,
  fetchFearGreed,
  fetchLiquidity,
  fetchOnchain,
  fetchPulse,
} from "./extra-feeds";
import { binanceFeed, hyperliquidFeed, okxFeed } from "./market-feeds";
import { blendExchangeLiquidation, fetchTopExchangeTapes } from "./exchange-liq";

export { buildModelMarket };

const extrasFeed: ExtrasFeed = {
  onchain: fetchOnchain,
  clarity: fetchClarity,
  fearGreed: fetchFearGreed,
  liquidity: fetchLiquidity,
  pulse: fetchPulse,
};

export function fetchLiveMarket(range: ChartRange, liq: LiqRange): Promise<MarketPayload> {
  return loadMarket(range, liq, [binanceFeed, okxFeed, hyperliquidFeed], buildModelMarket, async (r, env, signal) => {
    const tapes = await fetchTopExchangeTapes(r, signal);
    return blendExchangeLiquidation(tapes, env, 96, r);
  });
}

export function fetchDeskExtras(range: ChartRange) {
  return loadExtras(range, extrasFeed);
}

export { fetchTick } from "./tick";
