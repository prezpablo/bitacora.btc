import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { formatMarketClock } from "./market-clock.ts";

test("the market clock names the Uruguay zone", () => {
  const shown = formatMarketClock(Date.parse("2026-06-15T15:00:00.000Z"));
  assert.match(shown, /12:00:00/);
  assert.notEqual(shown.replace(/\s/g, ""), "12:00:00");
  assert.match(shown, /UYT|GMT-3|UTC-3|-03/);
});

test("a model price says it is not a quote and the clock is the market one", () => {
  const desk = readFileSync(new URL("../components/dashboard/desk.tsx", import.meta.url), "utf8");
  assert.match(desk, /formatMarketClock/);
  assert.match(desk, /source === "modelo" \? t\("notQuote"\)/);
  assert.match(desk, /priceSum/);
  assert.match(desk, /summary=\{priceSum\}/);
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.match(i18n, /notQuote: "no es cotización"/);
  assert.match(i18n, /notQuote: "not a quote"/);
  assert.match(i18n, /notQuote: "não é cotação"/);
  assert.match(i18n, /priceSum: "Precio \{price\}\. Hora de Uruguay: \{when\}\."/);
  assert.match(i18n, /priceSum: "Price \{price\}\. Uruguay time: \{when\}\."/);
  assert.match(i18n, /priceSum: "Preço \{price\}\. Hora do Uruguai: \{when\}\."/);
});

test("the place list is visible and the globe stays on the keyboard", () => {
  const map = readFileSync(new URL("../components/map/spend-map.tsx", import.meta.url), "utf8");
  assert.match(map, /id="map-list-title"/);
  assert.doesNotMatch(map, /<details[\s\S]{0,180}mapListTitle/);
  const globe = readFileSync(new URL("../components/map/world-globe.tsx", import.meta.url), "utf8");
  assert.match(globe, /tabIndex=\{0\}/);
  assert.match(globe, /aria-label=\{t\("globeKeys"\)\}/);
});
