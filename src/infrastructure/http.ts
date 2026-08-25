export async function fetchJson<T>(url: string, signal: AbortSignal, init?: RequestInit): Promise<T> {
  const u = url.includes("?") ? `${url}&_=${Date.now()}` : `${url}?_=${Date.now()}`;
  const res = await fetch(u, { cache: "no-store", signal, ...init });
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as T;
}
