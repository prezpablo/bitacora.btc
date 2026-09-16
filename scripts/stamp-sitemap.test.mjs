import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stampLastmod } from "./stamp-sitemap.mjs";

test("D-SITEMAP stampLastmod rewrites every lastmod", () => {
  const xml = `<urlset><url><lastmod>2026-09-07</lastmod></url><url><lastmod>2026-01-01</lastmod></url></urlset>`;
  const out = stampLastmod(xml, "2026-09-15");
  assert.equal(out.includes("2026-09-07"), false);
  assert.equal(out.match(/<lastmod>2026-09-15<\/lastmod>/g)?.length, 2);
});

test("committed sitemap is not frozen at 2026-09-07", () => {
  const xml = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../public/sitemap.xml"), "utf8");
  assert.doesNotMatch(xml, /<lastmod>2026-09-07</);
  assert.match(xml, /<lastmod>2026-09-\d{2}</);
  assert.match(xml, /bitacorabtc.org\/LICENSE/);
});
