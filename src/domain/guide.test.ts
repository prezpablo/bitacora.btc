import assert from "node:assert/strict";
import { test } from "node:test";
import { geoUri, osmDirectionsUrl, pickGuideMode } from "./guide.ts";

test("nearby shop uses walking OSRM, far uses car", () => {
  const mvd = { lat: -34.9011, lon: -56.1645 };
  assert.equal(pickGuideMode(mvd, { lat: -34.905, lon: -56.17 }), "foot");
  assert.equal(pickGuideMode(mvd, { lat: -34.9, lon: -58.38 }), "car");
});

test("OSM directions URL uses FOSSGIS OSRM, not Google", () => {
  const url = osmDirectionsUrl({ lat: -34.9, lon: -56.16 }, { lat: -34.91, lon: -56.2 }, "foot");
  assert.ok(url.startsWith("https://www.openstreetmap.org/directions"));
  assert.ok(url.includes("fossgis_osrm_foot"));
  assert.ok(!url.includes("google"));
});

test("geo URI keeps Organic Maps / OsmAnd compatible", () => {
  const u = geoUri({ lat: -34.9, lon: -56.16 }, "Moshi Moshi");
  assert.ok(u.startsWith("geo:-34.9"));
  assert.ok(u.includes("Moshi%20Moshi") || u.includes("Moshi"));
});
