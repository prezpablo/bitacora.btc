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
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.match(i18n, /notQuote: "no es cotización"/);
  assert.match(i18n, /notQuote: "not a quote"/);
  assert.match(i18n, /notQuote: "não é cotação"/);
});
