import assert from "node:assert/strict";
import { test } from "node:test";
import { hasWebGL } from "./webgl.ts";

test("hasWebGL is false without a document (SSR)", () => {
  assert.equal(hasWebGL(), false);
});
