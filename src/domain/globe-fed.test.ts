import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the big globe figure is labeled as BTC Map, not the overlay", () => {
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  const globe = readFileSync(new URL("../components/map/world-globe.tsx", import.meta.url), "utf8");
  assert.match(globe, /t\("globeFed"\)/);
  assert.match(i18n, /BTC Map · red federada, no el overlay/);
  assert.match(i18n, /BTC Map · federated network, not the overlay/);
  assert.match(i18n, /BTC Map · rede federada, não o overlay/);
  assert.doesNotMatch(globe, /globeWorldShort/);
});
