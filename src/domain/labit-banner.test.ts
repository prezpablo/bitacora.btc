import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { pickFeatured } from "./featured-event.ts";

test("from 11 nov the banner is El Zonte, then Asunción on the 22nd", () => {
  const beach = pickFeatured("2026-11-11");
  assert.equal(beach?.id, "bitcoin-beach-2026");
  assert.equal(beach?.split, true);
  assert.equal(beach?.accent, "#FE6A00");
  assert.match(beach?.site || "", /bitcoinbeach\.com/);
  assert.equal(pickFeatured("2026-11-02")?.id, "bitcoin-historico-2026");
  assert.equal(pickFeatured("2026-10-30")?.id, "labitconf-2026");
  assert.equal(pickFeatured("2026-11-21")?.id, "bitcoin-beach-2026");
  const sov = pickFeatured("2026-11-22");
  assert.equal(sov?.id, "sovereign-2026");
  assert.equal(sov?.accent, "#f7931a");
  assert.equal(sov?.ink, "#0b0b0b");
  assert.match(sov?.tickets || "", /satlantis\.io\/embed\/events\/1002890\/tickets/);
  assert.match(sov?.agenda || "", /sovereign-conference\.com\/es\/#program/);
  assert.equal(pickFeatured("2026-11-23")?.id, "sovereign-2026");
  const crypta = pickFeatured("2026-11-24");
  assert.equal(crypta?.id, "crypta-2026-11-24");
  assert.equal(crypta?.accent, "#ff4b1f");
  assert.match(crypta?.tickets || "", /youtube\.com\/@LaCryptaOk\/live/);
  assert.match(crypta?.site || "", /lacrypta\.ar/);
  assert.equal(pickFeatured("2026-11-25"), null);
});

test("the banner is a link, not a sponsored or featured seal", () => {
  const banner = readFileSync(new URL("../components/dashboard/labitconf-banner.tsx", import.meta.url), "utf8");
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.match(banner, /pickFeatured/);
  assert.match(banner, /bitcoinbeach\.com/);
  assert.match(banner, /grid-cols-\[1fr_auto_1fr\]/);
  assert.doesNotMatch(banner, /labitKicker|Patrocinado|Sponsored|Destacado/);
  assert.doesNotMatch(i18n, /labitKicker|Destacado · LABITCONF|Featured · LABITCONF|Destaque · LABITCONF/);
});
