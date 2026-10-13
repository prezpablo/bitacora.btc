import assert from "node:assert/strict";
import { test } from "node:test";
import { globeAntialias } from "./net.ts";

test("globe antialias drops only on slow net and DPR at most 2", () => {
  assert.equal(globeAntialias(true, 2), false);
  assert.equal(globeAntialias(true, 1), false);
  assert.equal(globeAntialias(true, 3), true);
  assert.equal(globeAntialias(false, 1), true);
});
