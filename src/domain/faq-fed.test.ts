import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the visible FAQ says Bitácora is not a clone of BTC Map", () => {
  const seo = readFileSync(new URL("../lib/seo.ts", import.meta.url), "utf8");
  assert.match(seo, /id="faq-seo"|#faq-seo/);
  assert.match(seo, /No es un clon\. El overlay propio/);
  assert.match(seo, /It is not a clone\. The own overlay/);
  assert.match(seo, /Não é um clone\. O overlay próprio/);
  assert.doesNotMatch(seo, /Bitácora\.btc es un clon|Bitácora\.btc is a clone|Bitácora\.btc é um clone/);
});
