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

test("rights name the challenge to a personal valuation, and the five-day term stays on arts. 14 and 15", () => {
  const legal = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.match(legal, /impugnar esa valoración \(art\. 16\)/);
  assert.match(legal, /challenge that valuation \(art\. 16\)/);
  assert.match(legal, /impugnar essa valoração \(art\. 16\)/);
  assert.doesNotMatch(legal, /arts\. 14 a 16|arts\. 14 to 16|arts\. 14 a 16/);
  assert.match(legal, /5 días hábiles \(arts\. 14 y 15\)/);
  assert.match(legal, /5 business days \(arts\. 14 and 15\)/);
  assert.match(legal, /5 dias úteis \(arts\. 14 e 15\)/);
});

test("PSAV cites Act 20.446 art. 693 and Circular 2507, and does not exempt a natural person", () => {
  const legal = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  const note = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  for (const src of [legal, note]) {
    assert.match(src, /20\.446/);
    assert.match(src, /2507/);
  }
  assert.match(legal, /art\. 127\.22/);
  assert.match(legal, /16\.696, art\. 37, literal H/);
  assert.match(legal, /Act 16\.696, art\. 37, letter H/);
  assert.match(legal, /Lei n\.º 16\.696, art\. 37, literal H/);
  assert.doesNotMatch(legal, /persona física no es PSAV|natural person is not a VASP|pessoa física não é PSAV/);
});
