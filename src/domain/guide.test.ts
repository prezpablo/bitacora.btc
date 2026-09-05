import assert from "node:assert/strict";
import { test } from "node:test";
import { geodesicLine, geoUri, kmBetween, pickGuideMode } from "./guide.ts";

test("nearby shop uses walking, far uses car", () => {
  const mvd = { lat: -34.9011, lon: -56.1645 };
  assert.equal(pickGuideMode(mvd, { lat: -34.905, lon: -56.17 }), "foot");
  assert.equal(pickGuideMode(mvd, { lat: -34.9, lon: -58.38 }), "car");
});

test("geodesic stays on our map and includes both ends", () => {
  const a = { lat: -34.9, lon: -56.16 };
  const b = { lat: -34.91, lon: -56.2 };
  const line = geodesicLine(a, b);
  assert.equal(line[0]?.lat, a.lat);
  assert.equal(line.at(-1)?.lon, b.lon);
  assert.ok(line.length >= 3);
});

test("geo URI keeps Organic Maps / OsmAnd compatible", () => {
  const u = geoUri({ lat: -34.9, lon: -56.16 }, "Moshi Moshi");
  assert.ok(u.startsWith("geo:-34.9"));
  assert.ok(!u.includes("openstreetmap.org"));
});
