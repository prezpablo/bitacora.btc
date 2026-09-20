import assert from "node:assert/strict";
import { test } from "node:test";
import { OFM_ORIGIN, OFM_STYLE, OSMFR_URL, OTM_URL } from "./map-tiles.ts";

test("D-TILE-03 primary is OpenFreeMap, streets OSM-FR, fallback OpenTopo", () => {
  assert.match(OFM_STYLE, /tiles\.openfreemap\.org\/styles\/bright/);
  assert.equal(OFM_ORIGIN, "https://tiles.openfreemap.org");
  assert.match(OSMFR_URL, /tile\.openstreetmap\.fr\/hot/);
  assert.match(OTM_URL, /tile\.opentopomap\.org/);
  assert.doesNotMatch(OFM_STYLE, /arcgisonline/);
  assert.doesNotMatch(OSMFR_URL, /tile\.openstreetmap\.org/);
  assert.doesNotMatch(OTM_URL, /cartocdn/);
});
