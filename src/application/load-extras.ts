import type { ChartRange, DeskExtras } from "@/domain";
import type { ExtrasFeed } from "./ports";

export async function loadExtras(range: ChartRange, feed: ExtrasFeed): Promise<DeskExtras> {
  const [onchain, clarity, fearGreed, liquidity, pulse] = await Promise.all([
    feed.onchain(range).catch(() => null),
    feed.clarity().catch(() => null),
    feed.fearGreed().catch(() => null),
    feed.liquidity().catch(() => null),
    feed.pulse().catch(() => null),
  ]);
  return { onchain, clarity, fearGreed, liquidity, pulse };
}
