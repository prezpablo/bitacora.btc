import { getRequest } from "@tanstack/react-start/server";

const hits = new Map<string, number[]>();

export function tooMany(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  return false;
}

export function clientKey(extra = "") {
  try {
    const req = getRequest();
    const h = req.headers;
    const raw =
      h.get("cf-connecting-ip") ||
      h.get("x-real-ip") ||
      (h.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
      "anon";
    return `${raw}|${extra}`;
  } catch {
    return `anon|${extra}`;
  }
}
