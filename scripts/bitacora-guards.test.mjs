import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const exists = (p) => existsSync(join(root, p));

function walkTs(rel) {
  const out = [];
  const start = join(root, rel);
  const stack = [start];
  while (stack.length) {
    const dir = stack.pop();
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) stack.push(p);
      else if (/\.(ts|tsx)$/.test(name)) out.push(p.slice(root.length + 1).replaceAll("\\", "/"));
    }
  }
  return out;
}

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

test("Consciencia Bitcoin overlay describes LATAM Cripto Mom", () => {
  const src = read("src/infrastructure/map-csv-io.ts");
  assert.match(src, /FOUNDING_DESCRIPTION/);
  assert.match(src, /FOUNDING_LINKS/);
  assert.match(read("src/domain/globe.ts"), /psicología financiera/);
  assert.match(read("src/domain/globe.ts"), /youtube.com\/@latamcriptomom/);
  assert.match(read("src/components/map/map-listing-card.tsx"), /withFoundingProfile/);
  assert.match(read("src/components/map/social-row.tsx"), /<span>\{label\}<\/span>/);
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
  assert.match(src, /escapeHtml\(imgSrc/);
  assert.match(src, /\{c\.name\}/);
  assert.match(src, /\{p\.name\}/);
  assert.equal(src.includes("innerHTML =") && src.includes("${c.name}"), false);
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

test("captcha has audio and screen-reader alternatives", () => {
  const src = read("src/components/map/captcha.tsx");
  assert.match(src, /speakChallenge/);
  assert.match(src, /captchaListen/);
  assert.match(src, /captchaSpoken/);
  assert.match(src, /sr-only/);
  assert.match(src, /aria-live/);
  assert.match(src, /role="alert"/);
  assert.match(src, /Volume2/);
  const i18n = read("src/lib/i18n.ts");
  assert.match(i18n, /captchaListen:/);
  assert.match(i18n, /captchaAlt:/);
  assert.match(i18n, /captchaNoSpeech:/);
});

test("clean architecture: no lib/btc facade, last-known is server-only", () => {
  assert.equal(exists("src/lib/btc"), false);
  assert.equal(exists("src/infrastructure/last-known.ts"), false);
  const lk = read("src/infrastructure/last-known.server.ts");
  assert.match(lk, /from "node:fs"/);
  assert.match(lk, /withLastKnown/);
  const desk = read("src/components/dashboard/desk.tsx");
  assert.match(desk, /buildModelMarket } from "@\/application"/);
  assert.equal(desk.includes("@/infrastructure/model-market"), false);
});

test("UI does not import disk or feed adapters", () => {
  const files = walkTs("src/components");
  const banned = /from ["']@\/infrastructure\/(last-known|sqlite|extra-feeds|compose|model-market)/;
  const fsImport = /from ["']node:fs/;
  for (const f of files) {
    const src = read(f);
    assert.equal(banned.test(src), false, f);
    assert.equal(fsImport.test(src), false, f);
  }
});

test("map pins still trust-check shops and communities", () => {
  const src = read("src/components/map/spend-map.tsx");
  assert.match(src, /communityTrust/);
  assert.match(src, /listingTrust/);
});

