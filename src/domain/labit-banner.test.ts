import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the LABITCONF banner is a link, not a sponsored or featured seal", () => {
  const banner = readFileSync(new URL("../components/dashboard/labitconf-banner.tsx", import.meta.url), "utf8");
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.match(banner, /labitconf\.com/);
  assert.doesNotMatch(banner, /labitKicker/);
  assert.doesNotMatch(i18n, /labitKicker|Destacado · LABITCONF|Featured · LABITCONF|Destaque · LABITCONF|Patrocinado|Sponsored|Patrocinado/);
});
