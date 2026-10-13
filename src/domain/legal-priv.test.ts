import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("public policy does not admit the gaps", () => {
  const src = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /brecha a cerrar|that is a gap|falha a fechar/i);
  assert.doesNotMatch(src, /clone an[oó]nimo|anonymous clone/i);
  assert.match(src, /30 días/);
  assert.match(src, /30 days/);
  assert.match(src, /30 dias/);
  assert.match(src, /HMAC-SHA256/);
});
