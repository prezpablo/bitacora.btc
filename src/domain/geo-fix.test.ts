import assert from "node:assert/strict";
import { test } from "node:test";
import { isPreciseFix, pickBestFix } from "./geo-fix.ts";
import type { GeoFix } from "./geo-frame.ts";

const gps = (accuracy: number): GeoFix => ({ lat: -34.47, lon: -57.84, accuracy, source: "gps" });
const ip: GeoFix = { lat: -34.9, lon: -56.16, accuracy: 12_000, source: "ip" };

test("GPS beats IP even if IP claims a smaller number", () => {
  const best = pickBestFix(ip, gps(80));
  assert.equal(best?.source, "gps");
  assert.equal(best?.accuracy, 80);
});

test("among GPS samples the tighter circle wins", () => {
  const best = pickBestFix(gps(400), gps(35));
  assert.equal(best?.accuracy, 35);
  assert.ok(isPreciseFix(best!));
});

test("tap is better than IP, worse than GPS", () => {
  const tap: GeoFix = { lat: -34.47, lon: -57.84, accuracy: 30, source: "tap" };
  assert.equal(pickBestFix(tap, ip)?.source, "tap");
  assert.equal(pickBestFix(tap, gps(40))?.source, "gps");
});
