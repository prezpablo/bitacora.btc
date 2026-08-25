import type { MarketTick } from "@/domain";
import { fetchJson } from "./http";

type OkxRes<T> = { code: string; data: T };

export async function fetchTick(): Promise<MarketTick> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6_000);
  try {
    const j = await fetchJson<OkxRes<Record<string, string>[]>>(
      "https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT-SWAP",
      ctrl.signal,
    );
    const row = j.data?.[0];
    if (!row) throw new Error("tick empty");
    const price = Number(row.last);
    const open = Number(row.open24h);
    if (!(price > 0)) throw new Error("tick px");
    return {
      price,
      change24h: open > 0 ? ((price - open) / open) * 100 : 0,
      high24h: Number(row.high24h) || price,
      low24h: Number(row.low24h) || price,
      asOf: Number(row.ts) || Date.now(),
    };
  } finally {
    clearTimeout(timer);
  }
}
