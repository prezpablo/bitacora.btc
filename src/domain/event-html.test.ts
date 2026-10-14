import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { EVENT_HTML_CAP, upcomingEventHtml } from "./event-html.ts";

const now = Date.parse("2026-10-14T12:00:00Z");

test("the home HTML keeps the next six events and drops the rest", () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({
    title: `Meetup ${i}`,
    city: i % 2 ? "" : "Montevideo",
    startAt: now + (8 - i) * 86_400_000,
    url: `https://luma.com/e${i}`,
    description: "no debe viajar",
    image: "https://images.lumacdn.com/a.jpg",
  }));
  rows.push({ title: "Ayer", city: "Colonia", startAt: now - 1000, url: "https://luma.com/old", description: "", image: "" });
  rows.push({ title: "Sin https", city: "CABA", startAt: now + 1000, url: "http://luma.com/x", description: "", image: "" });
  const out = upcomingEventHtml(rows, now);
  assert.equal(out.length, EVENT_HTML_CAP);
  assert.deepEqual(
    out.map((e) => e.title),
    ["Meetup 7", "Meetup 6", "Meetup 5", "Meetup 4", "Meetup 3", "Meetup 2"],
  );
  assert.equal("description" in out[0], false);
  assert.equal("image" in out[0], false);
});

test("the home route reads the six and does not scrape again", () => {
  const route = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
  const fn = readFileSync(new URL("../infrastructure/server-fns.ts", import.meta.url), "utf8");
  const events = readFileSync(new URL("../infrastructure/events.ts", import.meta.url), "utf8");
  const desk = readFileSync(new URL("../components/dashboard/desk.tsx", import.meta.url), "utf8");
  assert.match(route, /getEventHtml/);
  assert.match(fn, /readLast<EventHtmlRow\[\]>\("events-html"\)/);
  assert.doesNotMatch(fn, /fetchNetworkEvents[\s\S]{0,80}events-html|getEventHtml[\s\S]{0,200}fetchLuma/);
  assert.match(events, /writeLast\("events-html"/);
  assert.match(desk, /EventHtmlList/);
  const listAt = desk.indexOf("<EventHtmlList");
  const lazyAt = desk.indexOf("<NetworkEvents");
  assert.ok(listAt > 0 && listAt < lazyAt);
});
