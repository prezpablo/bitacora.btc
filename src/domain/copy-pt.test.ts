import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const PT_PT = /\b(teu|tua|teus|tuas|junta-te|damos-te|estás|quiseres|sítio|ecrã|secção|morada|caduca|libelinha)\b/i;

test("pt copy is Brazilian, not European", () => {
  const src = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  const dict = src.slice(src.indexOf("const pt:"), src.indexOf("export const COPY"));
  const conciencia = src.slice(src.indexOf("export const CONCIENCIA"));
  const ptBlock = conciencia.slice(conciencia.indexOf("\n  pt: {"), conciencia.indexOf("\n  },\n};"));
  const legal = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  const legalPt = legal.slice(legal.indexOf("const pt:"));
  const seo = readFileSync(new URL("../lib/seo.ts", import.meta.url), "utf8");
  const road = readFileSync(new URL("./roadmap-web3.ts", import.meta.url), "utf8");
  const roadPt = road.slice(road.lastIndexOf("const pt:"));
  const sov = readFileSync(new URL("./soberania.ts", import.meta.url), "utf8");
  const sovPt = sov.slice(sov.lastIndexOf("const pt:"));
  for (const block of [dict, ptBlock, legalPt, seo, roadPt, sovPt]) assert.doesNotMatch(block, PT_PT);
  assert.match(dict, /você/i);
  assert.match(legalPt, /você/);
  assert.doesNotMatch(legalPt, /sítio|ecrã|utilizador|morada|controlo da/);
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
