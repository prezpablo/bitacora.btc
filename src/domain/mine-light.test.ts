import assert from "node:assert/strict";
import { test } from "node:test";
import { mineLightTone } from "./mine-light.ts";

test("mine light example stays a phrase, not a quote", () => {
  assert.equal(mineLightTone(4), "room");
  assert.equal(mineLightTone(6), "room");
  assert.equal(mineLightTone(9), "thin");
  assert.equal(mineLightTone(12), "eats");
  assert.equal(mineLightTone(12.4), "eats");
});
