export function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/** 0 escasa · 100 amplia: spread, profundidad e imbalance del libro. */
export function liquidityScore(input: {
  spreadBps: number;
  depthUsd: number;
  imbalance: number;
}): number {
  const spreadScore = clamp01(1 - input.spreadBps / 8);
  const depthScore = clamp01(input.depthUsd / 25_000_000);
  const balScore = clamp01(1 - Math.abs(input.imbalance - 0.5) * 2);
  return Math.round((0.35 * spreadScore + 0.4 * depthScore + 0.25 * balScore) * 100);
}

export function seriesDelta(values: { v: number }[]): number | null {
  const a = values[0]?.v;
  const b = values[values.length - 1]?.v;
  if (a == null || b == null || a === 0) return null;
  return ((b - a) / a) * 100;
}
