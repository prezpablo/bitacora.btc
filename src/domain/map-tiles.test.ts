import assert from "node:assert/strict";
import { test } from "node:test";
import { OFM_ORIGIN, OFM_STYLE, OTM_URL } from "./map-tiles.ts";

test("D-TILE-03 primary is OpenFreeMap, fallback OpenTopo, never Esri/OSMF/Carto", () => {
  assert.match(OFM_STYLE, /tiles\.openfreemap\.org/);
  assert.equal(OFM_ORIGIN, "https://tiles.openfreemap.org");
  assert.match(OTM_URL, /tile\.opentopomap\.org/);
  assert.doesNotMatch(OFM_STYLE, /arcgisonline/);
  assert.doesNotMatch(OTM_URL, /openstreetmap\.org\/\{z\}/);
  assert.doesNotMatch(OTM_URL, /cartocdn/);
});
