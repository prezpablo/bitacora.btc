export type FeeQuote = { feeFast?: number; feeHour?: number };

function n(v: unknown): number | undefined {
  const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(x) && x >= 0 ? Math.round(x) : undefined;
}

function quote(fast?: number, hour?: number): FeeQuote {
  const q: FeeQuote = {};
  if (fast != null) q.feeFast = fast;
  if (hour != null) q.feeHour = hour;
  return q;
}

export function feesFromMempool(j: { fastestFee?: number; hourFee?: number } | null | undefined): FeeQuote {
  if (!j) return {};
  return quote(n(j.fastestFee), n(j.hourFee));
}

export function feesFromEsplora(j: Record<string, number> | null | undefined): FeeQuote {
  const fees = j ?? {};
  return quote(n(fees["1"] ?? fees["2"]), n(fees["6"] ?? fees["10"] ?? fees["5"]));
}

/** bitcoiner.live: estimates["30"].sat_per_vbyte = ~next block, "60" ≈ 1h. */
export function feesFromBitcoiner(j: {
  estimates?: Record<string, { sat_per_vbyte?: number } | number>;
} | null | undefined): FeeQuote {
  const e = j?.estimates ?? {};
  const sat = (k: string) => {
    const row = e[k];
    if (row && typeof row === "object") return n(row.sat_per_vbyte);
    return n(row);
  };
  return quote(sat("30") ?? sat("20") ?? sat("15"), sat("60") ?? sat("120"));
}

export function quoteReady(q: FeeQuote | null | undefined) {
  return q?.feeFast != null;
}

export function mergeLiveFees<T extends FeeQuote>(live: T, last?: FeeQuote | null): T & { feeStale?: boolean } {
  if (quoteReady(live)) return { ...live, feeStale: false };
  if (quoteReady(last)) {
    return {
      ...live,
      feeFast: last!.feeFast,
      feeHour: last?.feeHour ?? live.feeHour,
      feeStale: true,
    };
  }
  return { ...live, feeStale: true };
}
