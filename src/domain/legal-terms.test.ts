import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LEGAL_EU } from "./legal-eu.ts";
import { legalHref } from "../lib/locale.ts";
import { legalFilled } from "./legal-config.ts";

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

test("the legal title names the texts and a bracket date stays hidden", () => {
  const src = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.match(src, /legalTitle: "Textos legales"/);
  assert.match(src, /legalTitle: "Legal"/);
  assert.match(src, /legalTitle: "Textos legais"/);
  assert.match(src, /Versiones anteriores: 2\.0, 2\.2 y 2\.4/);
  const page = readFileSync(new URL("../components/dashboard/legal-eu.tsx", import.meta.url), "utf8");
  assert.match(page, /legalFilled\(LEGAL\.vigencia\)/);
  assert.doesNotMatch(page, /FECHA_VIGENCIA/);
  assert.equal(legalFilled("[FECHA_VIGENCIA]"), false);
});

test("open gaps and the plan are not published", () => {
  const legal = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.doesNotMatch(legal, /Brechas en curso|Open gaps|Falhas em curso|\nPlan:|\nPlano:/);
});

test("the breach notice does not say when it applies", () => {
  const legal = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.doesNotMatch(legal, /cuando corresponda|quando for o caso|where it applies, the people/);
  assert.match(legal, /en 24 horas se mitiga y en 72 horas se comunica a la URCDP/);
  assert.match(legal, /contained within 24 hours and reported to the URCDP within 72 hours/);
  assert.match(legal, /em 24 horas ela é contida e em 72 horas é comunicada à URCDP/);
  assert.match(legal, /where the GDPR applies/);
});
