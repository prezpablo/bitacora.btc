import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("a consent row is stored and an old CARGA code is wiped", async () => {
  process.env.BITACORA_SQLITE = join(mkdtempSync(join(tmpdir(), "bit-ops-")), "t.sqlite");
  const { writeConsent, listConsent, safeIpHash } = await import("../infrastructure/consent-log.ts");
  const { hashClientIp } = await import("../infrastructure/rate-limit.ts");
  const { purgeRetention } = await import("../infrastructure/retention.ts");
  const { openSqlite } = await import("../infrastructure/sqlite.ts");
  const cfg = readFileSync(new URL("./legal-config.ts", import.meta.url), "utf8");
  const log = readFileSync(new URL("../infrastructure/consent-log.ts", import.meta.url), "utf8");
  assert.match(cfg, /consentVersion: "2.13"/);
  assert.match(log, /CONSENT_VERSION = "2.13"/);
  const ip = "203.0.113.44";
  const hash = hashClientIp(ip);
  assert.equal(safeIpHash(ip), "");
  assert.notEqual(hash, ip);
  const now = Date.now();
  writeConsent({ kind: "contact", version: "2.0", ipHash: hash, ref: "T-1", created: now });
  writeConsent({ kind: "publish", version: "2.0", ipHash: hash, ref: "old", created: now - 31 * 24 * 60 * 60 * 1000 });
  const db = openSqlite();
  db.prepare(
    "INSERT INTO pins(id, name, blurb, proof, links, token, verified, verified_at, created) VALUES(?,?,?,?,?,?,?,?,?)",
  ).run("old", "n", "", "https://example.com", "", "CARGA-OLD", 0, 0, now - 31 * 24 * 60 * 60 * 1000);
  db.prepare(
    "INSERT INTO pins(id, name, blurb, proof, links, token, verified, verified_at, created) VALUES(?,?,?,?,?,?,?,?,?)",
  ).run("week", "n", "", "https://example.com", "", "CARGA-WEEK", 0, 0, now - 8 * 24 * 60 * 60 * 1000);
  db.prepare(
    "INSERT INTO pins(id, name, blurb, proof, links, token, verified, verified_at, created) VALUES(?,?,?,?,?,?,?,?,?)",
  ).run("live", "n", "", "https://example.com", "", "CARGA-LIVE", 1, now - 24 * 60 * 60 * 1000, now - 10 * 24 * 60 * 60 * 1000);
  db.prepare(
    "INSERT INTO pins(id, name, blurb, proof, links, token, verified, verified_at, created) VALUES(?,?,?,?,?,?,?,?,?)",
  ).run("new", "n", "", "https://example.com", "", "CARGA-NEW", 0, 0, now);
  db.prepare(
    "INSERT INTO experiences(id, activity, city, when_at, price, token, created) VALUES(?,?,?,?,?,?,?)",
  ).run("xp-old", "a", "c", "", "", "XP-OLD", now - 31 * 24 * 60 * 60 * 1000);
  db.prepare(
    "INSERT INTO experiences(id, activity, city, when_at, price, token, created) VALUES(?,?,?,?,?,?,?)",
  ).run("xp-new", "a", "c", "", "", "XP-NEW", now - 10 * 24 * 60 * 60 * 1000);
  db.prepare(
    "INSERT INTO map_rows(id, tipo, name, lat, lon, created, token) VALUES(?,?,?,?,?,?,?)",
  ).run("map-old", "shop", "n", 0, 0, now - 31 * 24 * 60 * 60 * 1000, "CARGA-MAP");
  db.prepare(
    "INSERT INTO map_rows(id, tipo, name, lat, lon, created, token) VALUES(?,?,?,?,?,?,?)",
  ).run("map-new", "shop", "n", 0, 0, now - 8 * 24 * 60 * 60 * 1000, "CARGA-FRESH");
  db.prepare("INSERT INTO rate_hits(k, t) VALUES(?, ?)").run(hash, now - 31 * 24 * 60 * 60 * 1000);
  const before = listConsent();
  assert.equal(before.length, 2);
  assert.equal(before[0]?.ipHash, hash);
  assert.doesNotMatch(JSON.stringify(before), new RegExp(ip.replaceAll(".", "\\.")));
  const n = purgeRetention(now);
  assert.equal(n.pins, 2);
  assert.equal(n.experiences, 1);
  assert.equal(n.map, 1);
  assert.equal(n.hashes, 1);
  assert.equal(n.consentHashes, 1);
  assert.equal(db.prepare("SELECT id FROM pins WHERE id = 'old'").get(), undefined);
  assert.equal(db.prepare("SELECT id FROM pins WHERE id = 'week'").get(), undefined);
  assert.equal(String(db.prepare("SELECT token FROM pins WHERE id = 'live'").get()?.token), "CARGA-LIVE");
  assert.equal(String(db.prepare("SELECT token FROM pins WHERE id = 'new'").get()?.token), "CARGA-NEW");
  assert.equal(String(db.prepare("SELECT token FROM experiences WHERE id = 'xp-old'").get()?.token), "");
  assert.equal(String(db.prepare("SELECT token FROM experiences WHERE id = 'xp-new'").get()?.token), "XP-NEW");
  assert.equal(String(db.prepare("SELECT token FROM map_rows WHERE id = 'map-old'").get()?.token), "");
  assert.equal(String(db.prepare("SELECT name FROM map_rows WHERE id = 'map-old'").get()?.name), "n");
  assert.equal(String(db.prepare("SELECT token FROM map_rows WHERE id = 'map-new'").get()?.token), "CARGA-FRESH");
  const after = listConsent();
  assert.equal(after[0]?.ipHash, hash);
  assert.equal(after[1]?.ipHash, "");
});
