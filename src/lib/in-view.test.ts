import assert from "node:assert/strict";
import { test } from "node:test";

test("IntersectionObserver reveal latches", () => {
  const reveal = (shown: boolean, hit: boolean) => shown || hit;
  assert.equal(reveal(false, false), false);
  assert.equal(reveal(false, true), true);
  assert.equal(reveal(true, false), true);
});
