import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

test("public map patch still caps new rows and vote jumps", () => {
  const src = read("src/domain/map-csv.ts");
  assert.match(src, /added >= 2/);
  assert.match(src, /nextVotes > \(prev\.votes \|\| 0\) \+ 1/);
});

test("cancel pin requires CARGA token", () => {
  const src = read("src/infrastructure/server-fns.ts");
  assert.match(src, /cancelCommunityPin/);
  assert.match(src, /if \(!token\) return \{ ok: false, error: "token" \}/);
  assert.match(src, /pin\.token !== token/);
});

test("map GET enqueues scrapes instead of awaiting them", () => {
  const src = read("src/infrastructure/server-fns.ts");
  const start = src.indexOf("export const getMapCsv");
  const end = src.indexOf("export const saveMapCsv");
  const fn = src.slice(start, end);
  assert.match(fn, /enqueuePendingMap/);
  assert.equal(fn.includes("scrapeShowsToken"), false);
});

test("rate limit writes sqlite", () => {
  const src = read("src/infrastructure/rate-limit.ts");
  assert.match(src, /INSERT INTO rate_hits/);
});
