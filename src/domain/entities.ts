import type { ContinentId } from "./geo-regions";
import type { WeekHours } from "./hours";
import type { PayKey } from "./pays";
import type { SocialLink } from "./socials";

export type ChartRange = "1d" | "1w" | "1m" | "6m";
export type LiqRange = "1d" | "1w" | "1m";
export type MaKey = "ema1d" | "ema1w" | "ema1m" | "ema6m";

export type Candle = {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type HeatBucket = {
  t: number;
  bins: { price: number; long: number; short: number }[];
};

export type LiqCluster = {
  price: number;
  long: number;
  short: number;
};

export type LiqMagnet = {
  price: number;
  intensity: number;
  side: "long" | "short" | "mixed";
};

export type MarketPayload = {
  source: "hyperliquid" | "binance" | "okx" | "modelo";
  asOf: number;
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  longPct: number;
  shortPct: number;
  candles: Candle[];
  ema1d: (number | null)[];
  ema1w: (number | null)[];
  ema1m: (number | null)[];
  ema6m: (number | null)[];
  emaNow: Record<MaKey, number | null>;
  heatmap: HeatBucket[];
  clusters: LiqCluster[];
  magnets: LiqMagnet[];
  poc: number | null;
  vaLow: number | null;
  vaHigh: number | null;
  priceMin: number;
  priceMax: number;
  lookbackMs: number;
  liqVenues?: string[];
  tf?: ChartRange;
};

export type SeriesPoint = { t: number; v: number };

export type MarketTick = {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  asOf: number;
};

export type OnchainPayload = {
  height: number;
  hashrateEh: number;
  hashrateDelta: number | null;
  difficulty: number;
  difficultyDelta: number | null;
  txPerDay: number;
  txDelta: number | null;
  hashSeries: SeriesPoint[];
  txSeries: SeriesPoint[];
  asOf: number;
  feeFast?: number;
  feeHour?: number;
  mempoolTx?: number;
  mempoolVsize?: number;
  diffAdjPct?: number;
  blocksToAdj?: number;
  adjProgress?: number;
};

export type EtfFundFlow = { ticker: string; usdM: number };

export type EtfFlowPayload = {
  asOf: number;
  source: string;
  url: string;
  lastDate: string;
  lastUsdM: number;
  lastBtc: number | null;
  weekUsdM: number;
  monthUsdM: number;
  series: SeriesPoint[];
  funds: EtfFundFlow[];
};

export type ClarityPayload = {
  question: string;
  slug: string;
  yes: number;
  no: number;
  volume: number;
  volume24h: number;
  endDate: number;
  history: SeriesPoint[];
  url: string;
  asOf: number;
};

export type FearGreedPayload = {
  value: number;
  classification: string;
  asOf: number;
  history: SeriesPoint[];
  url: string;
};

export type LiquidityPayload = {
  source: "okx";
  asOf: number;
  price: number;
  spreadBps: number;
  depth1m: { bid: number; ask: number };
  depth2m: { bid: number; ask: number };
  coverBps: number;
  imbalance: number;
  openInterestUsd: number;
  oiDelta: number | null;
  oiSeries: SeriesPoint[];
  funding: number;
  fundingSeries: SeriesPoint[];
  nextFundingAt: number | null;
  basisBps: number;
  volume24h: number;
  score: number;
};

export type NewsItem = {
  id: string;
  title: string;
  originalTitle?: string;
  summary?: string;
  originalSummary?: string;
  sourceLang?: string;
  source: string;
  url: string;
  published: number;
  tag: string;
};

export type TrendItem = {
  id: string;
  name: string;
  symbol: string;
  rank: number | null;
  change24h: number | null;
};

export type GradeBand = "baja" | "media" | "alta" | "nueva";

export type MerchantPlace = {
  id: string;
  lat: number;
  lon: number;
  name: string;
  category: string;
  createdAt: number;
  description?: string;
  logo?: string;
};

export type MerchantVote = { stars: 1 | 2 | 3 | 4 | 5; at: number; by: string };

export type MerchantLocal = {
  description: string;
  notes?: string;
  votes: MerchantVote[];
  listedAt: number;
  removed?: boolean;
  hours?: WeekHours;
  pays?: PayKey[];
  links?: SocialLink[];
  address?: string;
  logo?: string;
  lat?: number;
  lon?: number;
  name?: string;
  category?: string;
  updatedAt?: number;
  /** Running average (CSV `score`). */
  score?: number;
  /** Vote count (CSV `votes`). */
  voteCount?: number;
  verifyToken?: string;
  verifiedAt?: number;
};

export type CommunityLink = { key?: string; label: string; url: string };

export type Community = {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lon: number;
  logo: string;
  description: string;
  links: CommunityLink[];
  createdAt: number;
  votes?: MerchantVote[];
  score?: number;
  voteCount?: number;
  verifyToken?: string;
  verifiedAt?: number;
};

export type PulsePayload = {
  news: NewsItem[];
  trends: TrendItem[];
  asOf: number;
  translate?: { status: "ok" | "partial" | "off" };
};

export type CommunityPost = {
  id: string;
  title: string;
  body: string;
  author: string;
  source: string;
  url: string;
  at: number;
  sats: number;
  comments: number;
};

export type CommunityFeed = {
  posts: CommunityPost[];
  asOf: number;
};

export type EventKind = "meetup" | "conference" | "workshop" | "hackathon" | "online" | "other";

export type NetworkEvent = {
  id: string;
  title: string;
  description: string;
  image: string;
  startAt: number;
  endAt?: number;
  timezone?: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  continent: ContinentId | "";
  url: string;
  platform: string;
  kind: EventKind;
};

export function eventIsLive(e: { startAt: number; endAt?: number }, now = Date.now()) {
  return Number.isFinite(e.startAt) && e.startAt >= now;
}

export type EventsPayload = {
  events: NetworkEvent[];
  asOf: number;
  sources: string[];
};

export type DeskExtras = {
  onchain: OnchainPayload | null;
  clarity: ClarityPayload | null;
  fearGreed: FearGreedPayload | null;
  liquidity: LiquidityPayload | null;
  pulse: PulsePayload | null;
};