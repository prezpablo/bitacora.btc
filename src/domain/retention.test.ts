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
  assert.match(cfg, /consentVersion: "2.7"/);
  assert.match(log, /CONSENT_VERSION = "2.7"/);
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
  ).run("new", "n", "", "https://example.com", "", "CARGA-NEW", 0, 0, now);
  db.prepare("INSERT INTO rate_hits(k, t) VALUES(?, ?)").run(hash, now - 31 * 24 * 60 * 60 * 1000);
  const before = listConsent();
  assert.equal(before.length, 2);
  assert.equal(before[0]?.ipHash, hash);
  assert.doesNotMatch(JSON.stringify(before), new RegExp(ip.replaceAll(".", "\\.")));
  const n = purgeRetention(now);
  assert.equal(n.pins, 1);
  assert.equal(n.hashes, 1);
  assert.equal(n.consentHashes, 1);
  const old = db.prepare("SELECT token FROM pins WHERE id = 'old'").get();
  const fresh = db.prepare("SELECT token FROM pins WHERE id = 'new'").get();
  assert.equal(String(old?.token), "");
  assert.equal(String(fresh?.token), "CARGA-NEW");
  const after = listConsent();
  assert.equal(after[0]?.ipHash, hash);
  assert.equal(after[1]?.ipHash, "");
});
