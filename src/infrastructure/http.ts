export async function fetchJson<T>(url: string, signal: AbortSignal, init?: RequestInit): Promise<T> {
  const u = url.includes("?") ? `${url}&_=${Date.now()}` : `${url}?_=${Date.now()}`;
  const res = await fetch(u, { cache: "no-store", signal, ...init });
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as T;
}

const BN_SPOT = ["https://data-api.binance.vision", "https://api.binance.com", "https://api1.binance.com"];

export async function fetchBinanceSpot<T>(pathAndQuery: string, signal: AbortSignal): Promise<T> {
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  let last: unknown;
  for (const host of BN_SPOT) {
    try {
      return await fetchJson<T>(`${host}${path}`, signal);
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error("binance");
}