import assert from "node:assert/strict";
import test from "node:test";
import { coinPinSize, globeCoinSize, pinBadgeSize } from "./map-pin-size.ts";

test("map ₿ shrinks at world zoom and grows modestly at street", () => {
  assert.equal(coinPinSize(3, "shop"), 10);
  assert.ok(coinPinSize(8, "shop") < coinPinSize(14, "shop"));
  assert.ok(coinPinSize(16, "community", true) <= 24);
  assert.ok(coinPinSize(16, "shop") < 26);
});

test("globe ₿ follows altitude", () => {
  assert.ok(globeCoinSize(2.35) <= 11);
  assert.ok(globeCoinSize(0.6) > globeCoinSize(2.0));
  assert.ok(globeCoinSize(0.6, true) <= 18);
});

test("badge stays smaller than the coin", () => {
  assert.ok(pinBadgeSize(12) < 12);
  assert.equal(pinBadgeSize(10), 8);
});
