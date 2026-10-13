import { openSqlite } from "./sqlite.ts";

const DAY = 24 * 60 * 60 * 1000;
export const RETAIN_MS = 30 * DAY;

export function purgeRetention(now = Date.now()) {
  const cut = now - RETAIN_MS;
  const db = openSqlite();
  const changes = (sql: string) => {
    db.prepare(sql).run(cut);
    const row = db.prepare("SELECT changes() AS n").get();
    return Number(row?.n) || 0;
  };
  return {
    pins: changes("UPDATE pins SET token = '' WHERE token != '' AND created > 0 AND created < ?"),
    map: changes("UPDATE map_rows SET token = '' WHERE token != '' AND created > 0 AND created < ?"),
    patches: changes("UPDATE listing_patches SET token = '' WHERE token != '' AND created > 0 AND created < ?"),
    hashes: changes("DELETE FROM rate_hits WHERE t < ?"),
    consentHashes: changes("UPDATE consent_log SET ip_hash = '' WHERE ip_hash != '' AND created > 0 AND created < ?"),
  };
}

/** El timer diario es la vía principal. Esto cubre el día si el proceso recibe un envío. */
export function purgeRetentionIfDue(now = Date.now()) {
  const db = openSqlite();
  const row = db.prepare("SELECT value FROM meta WHERE key = 'last_retain'").get();
  const last = Number(row?.value) || 0;
  if (now - last < 6 * 60 * 60 * 1000) return null;
  const n = purgeRetention(now);
  db.prepare(
    "INSERT INTO meta(key, value) VALUES('last_retain', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(String(now));
  return n;
}
