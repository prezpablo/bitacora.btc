import assert from "node:assert/strict";
import { test } from "node:test";
import { oneAtATime } from "./one-at-a-time.ts";

test("D-CSV-LOCK runs one map write after the other, even if the first fails", async () => {
  const order: string[] = [];
  const a = oneAtATime(async () => {
    order.push("a-start");
    await new Promise((r) => setTimeout(r, 20));
    order.push("a-end");
  });
  const b = oneAtATime(async () => {
    order.push("b");
  });
  await Promise.all([a, b]);
  assert.deepEqual(order, ["a-start", "a-end", "b"]);

  const seen: string[] = [];
  const bad = oneAtATime(async () => {
    throw new Error("fail");
  });
  const next = oneAtATime(async () => {
    seen.push("next");
    return 1;
  });
  await assert.rejects(bad);
  assert.equal(await next, 1);
  assert.deepEqual(seen, ["next"]);
});
