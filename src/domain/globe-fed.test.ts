import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the globe does not print the internal federated-network note", () => {
  const globe = readFileSync(new URL("../components/map/world-globe.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(globe, /t\("globeFed"\)/);
  assert.doesNotMatch(globe, /globeWorldShort/);
});
