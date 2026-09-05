import assert from "node:assert/strict";
import { test } from "node:test";
import { detectLang, localeOf } from "./translate.ts";

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
