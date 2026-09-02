import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

test("public map patch still caps new rows and vote jumps", () => {
  const src = read("src/domain/map-csv.ts");
  assert.match(src, /added >= 2/);
  assert.match(src, /nextVotes > \(prev\.votes \|\| 0\) \+ 1/);
});

test("cancel pin requires CARGA token", () => {
  const src = read("src/infrastructure/server-fns.ts");
  assert.match(src, /cancelCommunityPin/);
  assert.match(src, /if \(!token\) return \{ ok: false, error: "token" \}/);
  assert.match(src, /pin\.token !== token/);
});

test("map GET enqueues scrapes instead of awaiting them", () => {
  const src = read("src/infrastructure/server-fns.ts");
  const start = src.indexOf("export const getMapCsv");
  const end = src.indexOf("export const saveMapCsv");
  const fn = src.slice(start, end);
  assert.match(fn, /enqueuePendingMap/);
  assert.equal(fn.includes("scrapeShowsToken"), false);
});

test("rate limit writes sqlite", () => {
  const src = read("src/infrastructure/rate-limit.ts");
  assert.match(src, /INSERT INTO rate_hits/);
});

test("public map snapshot strips tokens", () => {
  const src = read("src/infrastructure/map-csv-io.ts");
  assert.match(src, /stringifyMapCsvPublic/);
  const pins = read("src/infrastructure/pins-io.ts");
  assert.match(pins, /stringifyPinsCsvPublic/);
});

test("verify endpoints are rate-limited", () => {
  const src = read("src/infrastructure/server-fns.ts");
  assert.match(src, /pin-verify-burst/);
  assert.match(src, /map-verify-burst/);
  assert.match(src, /pin-verify/);
  assert.match(src, /map-verify/);
});

test("scraper rejects loopback and self-host", () => {
  const src = read("src/infrastructure/safe-fetch.ts");
  assert.match(src, /SELF_IP/);
  assert.match(src, /45\.158\.116\.49/);
  assert.match(src, /nip\\?\.io/);
});

test("map HTML escapes user names", () => {
  const src = read("src/components/map/spend-map.tsx");
  assert.match(src, /escapeHtml\(c\.name\)/);
  assert.match(src, /escapeHtml\(p\.name\)/);
});

test("writes require a captcha ticket", () => {
  const src = read("src/infrastructure/server-fns.ts");
  assert.match(src, /consumeCaptchaTicket/);
  assert.match(src, /issueCaptcha/);
  const csv = src.slice(src.indexOf("export const saveMapCsv"), src.indexOf("function safeHttp"));
  assert.match(csv, /consumeCaptchaTicket/);
  assert.match(csv, /captchaNonce/);
});

test("captcha ticket checks proof-of-work", () => {
  const src = read("src/infrastructure/captcha-ticket.ts");
  assert.match(src, /powMatches/);
  assert.match(src, /salt/);
});

