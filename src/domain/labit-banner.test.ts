import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { pickFeatured } from "./featured-event.ts";

test("after LABITCONF the banner is Bitcoin Histórico, in its own gold", () => {
  const passed = pickFeatured("2026-11-02");
  assert.equal(passed?.id, "bitcoin-historico-2026");
  assert.equal(passed?.accent, "#EFBC53");
  assert.equal(passed?.agenda, undefined);
  assert.match(passed?.tickets || "", /bitcoinhistorico\.com\/#tickets/);
  assert.equal(pickFeatured("2026-10-30")?.id, "labitconf-2026");
  assert.equal(pickFeatured("2026-11-13"), null);
});

test("the banner is a link, not a sponsored or featured seal", () => {
  const banner = readFileSync(new URL("../components/dashboard/labitconf-banner.tsx", import.meta.url), "utf8");
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.match(banner, /pickFeatured/);
  assert.doesNotMatch(banner, /labitKicker|Patrocinado|Sponsored|Destacado/);
  assert.doesNotMatch(i18n, /labitKicker|Destacado · LABITCONF|Featured · LABITCONF|Destaque · LABITCONF/);
});
