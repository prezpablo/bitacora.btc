import type {
  Candle,
  ChartRange,
  ClarityPayload,
  FearGreedPayload,
  HeatBucket,
  LiqCluster,
  LiqRange,
  LiquidityPayload,
  MarketPayload,
  OnchainPayload,
  PulsePayload,
} from "@/domain";

export type Quote = {
  source: MarketPayload["source"];
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  longPct: number;
  shortPct: number;
};

export type LiveTape = {
  candles: Candle[];
  deep: Candle[];
  quote: Quote;
};

export interface MarketFeed {
  name: "hyperliquid" | "binance" | "okx";
  load(range: ChartRange, signal: AbortSignal): Promise<LiveTape>;
}

export interface HistoryFeed {
  loadDaily(signal: AbortSignal): Promise<Candle[]>;
}

export interface ExtrasFeed {
  onchain(range: ChartRange): Promise<OnchainPayload>;
  clarity(): Promise<ClarityPayload>;
  fearGreed(): Promise<FearGreedPayload>;
  liquidity(): Promise<LiquidityPayload>;
  pulse(): Promise<PulsePayload>;
}

export type LiqBlend = {
  heatmap: HeatBucket[];
  clusters: LiqCluster[];
  venues: string[];
};

export type LoadLiqBlend = (
  range: ChartRange,
  env: { min: number; max: number },
  signal: AbortSignal,
) => Promise<LiqBlend | null>;

export type ModelMarket = (range: ChartRange, liq: LiqRange) => MarketPayload;
