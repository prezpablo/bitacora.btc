import assert from "node:assert/strict";
import { test } from "node:test";
import { EVENT_PAGE, pageEvents, sortEventsByDate } from "./event-board.ts";

test("sortEventsByDate orders by startAt", () => {
  const rows = [{ startAt: 30 }, { startAt: 10 }, { startAt: 20 }];
  assert.deepEqual(
    sortEventsByDate(rows, "asc").map((r) => r.startAt),
    [10, 20, 30],
  );
  assert.deepEqual(
    sortEventsByDate(rows, "desc").map((r) => r.startAt),
    [30, 20, 10],
  );
});

test("pageEvents slices a 3x3 board", () => {
  const rows = Array.from({ length: 23 }, (_, i) => i);
  const first = pageEvents(rows, 1);
  assert.equal(first.pages, 3);
  assert.equal(first.slice.length, EVENT_PAGE);
  assert.deepEqual(first.slice, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const last = pageEvents(rows, 9);
  assert.equal(last.page, 3);
  assert.deepEqual(last.slice, [18, 19, 20, 21, 22]);
});
