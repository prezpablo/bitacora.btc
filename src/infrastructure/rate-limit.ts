import { createHash } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";

const hits = new Map<string, number[]>();
const MAX_KEYS = 4000;

function prune(now: number) {
  if (hits.size < MAX_KEYS) return;
  for (const [k, arr] of hits) {
    const keep = arr.filter((t) => now - t < 60 * 60_000);
    if (!keep.length) hits.delete(k);
    else hits.set(k, keep);
    if (hits.size < MAX_KEYS * 0.75) break;
  }
}

export function hashClientIp(raw: string) {
  return createHash("sha256").update(`bitacora.btc|${raw}`).digest("hex").slice(0, 24);
}

/** Último hop de X-Forwarded-For = el que Caddy agrega (no el spoof al inicio). */
export function peerFromHeaders(h: { get: (n: string) => string | null }) {
  const xff = (h.get("x-forwarded-for") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return xff.at(-1) || h.get("x-real-ip")?.trim() || "anon";
}

export function tooMany(key: string, max: number, windowMs: number) {
  const now = Date.now();
  prune(now);
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
    return `${hashClientIp(peerFromHeaders(req.headers))}|${extra}`;
  } catch {
    return `anon|${extra}`;
  }
}
