import assert from "node:assert/strict";
import { test } from "node:test";
import type { NetworkEvent } from "./entities.ts";
import {
  EVENT_PAGE,
  applyEventQuery,
  buildEventBoard,
  eventQueryFromSearch,
  pageEvents,
  sortEventsByDate,
} from "./event-board.ts";

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

function ev(over: Partial<NetworkEvent> & { startAt: number; id: string }): NetworkEvent {
  return {
    title: over.id,
    description: "",
    image: "",
    timezone: "UTC",
    city: "Montevideo",
    region: "",
    country: "Uruguay",
    countryCode: "UY",
    continent: "americas",
    url: `https://luma.com/${over.id}`,
    platform: "Luma",
    kind: "meetup",
    endAt: over.startAt + 3_600_000,
    ...over,
  };
}

test("buildEventBoard pages, sorts and filters on the server", () => {
  const now = 1_800_000_000_000;
  const rows = Array.from({ length: 23 }, (_, i) =>
    ev({
      id: `e${i}`,
      startAt: now + (i + 1) * 86_400_000,
      kind: i % 2 ? "conference" : "meetup",
      platform: i < 5 ? "Meetup" : "Luma",
    }),
  );
  const page1 = buildEventBoard(rows, { page: 1, dir: "asc" }, { asOf: now }, now);
  assert.equal(page1.total, 23);
  assert.equal(page1.pages, 3);
  assert.equal(page1.events.length, 9);
  assert.equal(page1.events[0]!.id, "e0");
  assert.equal(page1.facets.live, 23);
  assert.equal(page1.facets.kinds.meetup, 12);
  const conf = buildEventBoard(rows, { page: 1, kind: "conference" }, {}, now);
  assert.equal(conf.total, 11);
  assert.equal(conf.events.every((e) => e.kind === "conference"), true);
  const late = buildEventBoard(rows, { page: 1, dir: "desc" }, {}, now);
  assert.equal(late.events[0]!.id, "e22");
  const plat = buildEventBoard(rows, { platform: "Meetup" }, {}, now);
  assert.equal(plat.total, 5);
  const clamped = buildEventBoard(rows, { page: 99 }, {}, now);
  assert.equal(clamped.page, 3);
});

test("event query round-trips in the URL", () => {
  const q = eventQueryFromSearch("?ep=2&edir=desc&ekind=meetup&eplat=Luma&eco=uy&econt=americas&lang=es");
  assert.deepEqual(q, {
    page: 2,
    dir: "desc",
    kind: "meetup",
    platform: "Luma",
    country: "UY",
    continent: "americas",
  });
  const s = applyEventQuery(new URLSearchParams("lang=es"), q);
  assert.equal(s.get("ep"), "2");
  assert.equal(s.get("lang"), "es");
  const home = applyEventQuery(new URLSearchParams("ep=3&lang=es"), { page: 1, dir: "asc" });
  assert.equal(home.get("ep"), null);
  assert.equal(home.get("lang"), "es");
});
