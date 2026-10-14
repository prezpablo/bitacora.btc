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

test("privacyArt13 is unused copy; the art. 13 notice stays", () => {
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  const legal = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.doesNotMatch(i18n, /privacyArt13/);
  assert.match(legal, /Información del art\. 13/);
  assert.match(legal, /art\. 13 of Act 18\.331/);
  assert.match(legal, /Informação do art\. 13/);
});

test("LGPD art. 14 is not named, and niños y adolescentes is not published", () => {
  const legal = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.doesNotMatch(legal, /niños y adolescentes/i);
  assert.doesNotMatch(legal, /art\.\s*14/);
});

test("the accessibility self-assessment date is 14 October 2026", () => {
  const legal = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.match(legal, /14 de octubre de 2026/);
  assert.match(legal, /14 October 2026/);
  assert.match(legal, /14 de outubro de 2026/);
  assert.doesNotMatch(legal, /7 de setiembre de 2026|7 September 2026|7 de setembro de 2026/);
  assert.match(legal, /No es auditoría externa/);
  assert.match(legal, /not an external audit/);
  assert.match(legal, /Não é auditoria externa/);
});
