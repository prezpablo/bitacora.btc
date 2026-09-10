import assert from "node:assert/strict";
import { test } from "node:test";
import { onJoinMap, requestJoinMap } from "./join-map.ts";

test("D-NAV-04 join intent notifies listeners", () => {
  let n = 0;
  const off = onJoinMap(() => {
    n += 1;
  });
  requestJoinMap();
  assert.equal(n, 1);
  off();
  requestJoinMap();
  assert.equal(n, 1);
});
