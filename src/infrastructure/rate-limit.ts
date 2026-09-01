import { createHash } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { openSqlite } from "./sqlite";

const hits = new Map<string, number[]>();
const MAX_KEYS = 4000;

function persistHit(key: string, t: number) {
  try {
    const db = openSqlite();
    db.prepare("INSERT INTO rate_hits(k, t) VALUES(?, ?)").run(key, t);
    if (Math.random() < 0.05) {
      db.prepare("DELETE FROM rate_hits WHERE t < ?").run(t - 2 * 60 * 60_000);
    }
  } catch {
    /* sqlite optional in preview */
  }
}

function loadDisk(key: string, since: number) {
  try {
    const rows = openSqlite().prepare("SELECT t FROM rate_hits WHERE k = ? AND t > ?").all(key, since);
    return rows.map((r) => Number(r.t)).filter((n) => Number.isFinite(n) && n > since);
  } catch {
    return [] as number[];
  }
}

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
  const since = now - windowMs;
  const mem = (hits.get(key) || []).filter((t) => t > since);
  const disk = loadDisk(key, since);
  const arr = [...new Set([...mem, ...disk])].sort((a, b) => a - b);
  if (arr.length >= max) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  persistHit(key, now);
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
