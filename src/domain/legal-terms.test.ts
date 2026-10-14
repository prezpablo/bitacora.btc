import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LEGAL_EU } from "./legal-eu.ts";
import { legalHref } from "../lib/locale.ts";

const ANCHORS = ["aviso", "privacidad", "cookies", "accesibilidad", "terminos"];

test("terms has fourteen rules and does not invent a dispute deadline", () => {
  const dispute = /5 días hábiles|5 business days|5 dias úteis/;
  for (const lang of ["es", "en", "pt"] as const) {
    const ids = LEGAL_EU[lang].blocks.map((b) => b.id).filter(Boolean);
    for (const id of ANCHORS) assert.ok(ids.includes(id), `${lang} ${id}`);
    assert.ok(ids.includes("anexo"));
    const terms = LEGAL_EU[lang].blocks.find((b) => b.id === "terminos");
    assert.equal(terms?.clauses?.length, 14);
    const titles = (terms?.clauses || []).map((c) => c.title);
    for (let n = 1; n <= 14; n++) assert.match(titles[n - 1] || "", new RegExp(`^${n}\\.`));
    const joined = (terms?.clauses || []).map((c) => c.body).join("\n");
    assert.match(joined, dispute);
    assert.doesNotMatch(joined, /\[PLAZO|sigue la ODbL|remains under the ODbL as a derived|ficha derivada/);
    assert.match(joined, /no se afirma aquí|is not stated here|não é afirmada aqui/);
  }
});

test("kicker does not lead with the GDPR", () => {
  const src = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  const kickers = [...src.matchAll(/legalKicker: "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(kickers.length, 3);
  for (const k of kickers) assert.doesNotMatch(k, /^(RGPD|GDPR)/);
});

test("legal links keep the language query and the anchor", () => {
  assert.equal(legalHref("terminos", "?lang=pt"), "/legal?lang=pt#terminos");
  assert.equal(legalHref("aviso", ""), "/legal#aviso");
  assert.equal(legalHref("legal", "?lang=en"), "/legal?lang=en");
});
