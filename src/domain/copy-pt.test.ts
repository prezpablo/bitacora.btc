import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const PT_PT = /\b(teu|tua|teus|tuas|junta-te|damos-te|estás|quiseres|sítio|ecrã|secção|morada|caduca|libelinha)\b/i;

test("pt copy is Brazilian, not European", () => {
  const src = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  const dict = src.slice(src.indexOf("const pt:"), src.indexOf("export const COPY"));
  const conciencia = src.slice(src.indexOf("export const CONCIENCIA"));
  const ptBlock = conciencia.slice(conciencia.indexOf("\n  pt: {"), conciencia.indexOf("\n  },\n};"));
  assert.doesNotMatch(dict, PT_PT);
  assert.doesNotMatch(ptBlock, PT_PT);
  assert.match(dict, /você/i);
});

test("COPYRIGHT notice does not replace the AGPL", () => {
  const notice = readFileSync(new URL("../../public/COPYRIGHT", import.meta.url), "utf8");
  const license = readFileSync(new URL("../../LICENSE", import.meta.url), "utf8");
  assert.match(notice, /código fuente correspondiente/);
  assert.match(notice, /ODbL/);
  assert.doesNotMatch(notice, /GNU AFFERO GENERAL PUBLIC LICENSE/);
  assert.match(license, /GNU AFFERO GENERAL PUBLIC LICENSE/);
});

test("market module does not cite Act 17.250", () => {
  const src = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  for (const key of ["marketDisclaimer", "chartDisclaimer"]) {
    const rows = [...src.matchAll(new RegExp(`${key}: "([^"]+)"`, "g"))].map((m) => m[1]);
    assert.equal(rows.length, 3);
    for (const row of rows) assert.doesNotMatch(row, /17\.250/);
  }
});
