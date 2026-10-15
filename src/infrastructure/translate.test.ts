import assert from "node:assert/strict";
import { test } from "node:test";
import { detectLang, localeOf, translateNews } from "./translate.ts";

test("localeOf maps bitacora langs", () => {
  assert.equal(localeOf("es"), "es");
  assert.equal(localeOf("PT-BR"), "pt");
  assert.equal(localeOf("en-US"), "en");
});

test("detectLang does not treat El Salvador as Spanish", () => {
  assert.equal(detectLang("El Salvador adopts Bitcoin as legal tender"), "en");
  assert.equal(detectLang("La SEC retrasa el ETF y el mercado cae por las ventas"), "es");
  assert.equal(detectLang("O Bitcoin não é uma bolha para os bitcoiners"), "pt");
});

test("D-TR-CACHE same language skips the API and is not a failure", async () => {
  const item = {
    id: "1",
    title: "La SEC retrasa el ETF y el mercado cae por las ventas",
    summary: "El banco central mira la norma y la comunidad responde con calma",
    source: "Bitácora",
    url: "https://example.com/sec",
    published: 1,
    tag: "ley",
  };
  const ac = new AbortController();
  const { rows, status } = await translateNews([item], "es", ac.signal);
  assert.equal(status, "ok");
  assert.equal(rows[0]?.title, item.title);
  assert.equal(rows[0]?.summary, item.summary);
});
