import { TF_SPEC, resampleToTf, type Candle, type ChartRange } from "@/domain";
import { fetchBinanceSpot, fetchJson } from "./http";

const ORIGIN = Date.UTC(2013, 3, 28);

function parseRow(row: unknown[]): Candle | null {
  const t = Number(row[0]);
  const open = Number(row[1]);
  const high = Number(row[2]);
  const low = Number(row[3]);
  const close = Number(row[4]);
  const volume = Number(row[7] ?? row[5]) || 0;
  if (!(t > 0 && open > 0 && high > 0 && low > 0 && close > 0)) return null;
  const tMs = t < 20_000_000_000 ? t * 1000 : t;
  const base = volume > 0 && volume > close * 10 ? volume / close : volume;
  return { t: tMs, open, high, low, close, volume: Math.max(base, 0) };
}

async function binancePage(interval: string, startTime: number, signal: AbortSignal): Promise<Candle[]> {
  const q = `/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=1000&startTime=${startTime}`;
  try {
    const rows = await fetchJson<unknown[][]>(`https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=${interval}&limit=1000&startTime=${startTime}`, signal);
    if (Array.isArray(rows) && rows.length) return rows.map(parseRow).filter((c): c is Candle => !!c);
  } catch {
    /* spot vision */
  }
  const rows = await fetchBinanceSpot<unknown[][]>(q, signal);
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map(parseRow).filter((c): c is Candle => !!c);
}

export async function fetchBinanceTf(tf: ChartRange, signal: AbortSignal): Promise<Candle[]> {
  const spec = TF_SPEC[tf];
  const out: Candle[] = [];
  let start = ORIGIN;
  for (let n = 0; n < 12; n++) {
    const page = await binancePage(spec.binance, start, signal);
    if (page.length === 0) break;
    out.push(...page);
    const last = page[page.length - 1]!.t;
    if (page.length < 900 || last >= Date.now() - spec.stepMs) break;
    start = last + 1;
  }
  const unique = new Map<number, Candle>();
  for (const c of out) unique.set(c.t, c);
  const series = [...unique.values()].sort((a, b) => a.t - b.t);
  const aligned = resampleToTf(series, tf);
  if (aligned.length < 16) throw new Error("binance tf short");
  return aligned;
}

export async function fetchOkxTf(tf: ChartRange, signal: AbortSignal): Promise<Candle[]> {
  const spec = TF_SPEC[tf];
  const j = await fetchJson<{ code: string; data?: string[][] }>(
    `https://www.okx.com/api/v5/market/history-candles?instId=BTC-USDT-SWAP&bar=${spec.okx}&limit=300`,
    signal,
  );
  if (j.code !== "0" || !j.data?.length) throw new Error("okx tf");
  const rows = j.data
    .map((r) => parseRow(r))
    .filter((c): c is Candle => !!c)
    .sort((a, b) => a.t - b.t);
  const aligned = resampleToTf(rows, tf);
  if (aligned.length < 16) throw new Error("okx tf short");
  return aligned;
}
