import assert from "node:assert/strict";
import { test } from "node:test";
import { LATAM_ISO, tallyCountries, type GlobeCountryStat } from "./globe.ts";

function row(iso: string, shops: number): GlobeCountryStat {
  return { iso, lat: 0, lon: 0, shops, comms: 1, events: 0, cities: 2 };
}

test("LATAM_ISO keeps Uruguay, Argentina and Brazil; not ES or US", () => {
  assert.ok(LATAM_ISO.has("UY"));
  assert.ok(LATAM_ISO.has("AR"));
  assert.ok(LATAM_ISO.has("BR"));
  assert.equal(LATAM_ISO.has("ES"), false);
  assert.equal(LATAM_ISO.has("US"), false);
});

test("tallyCountries splits Latam from the world", () => {
  const rows = [row("UY", 9), row("AR", 94), row("US", 4000), row("DE", 800)];
  const world = tallyCountries(rows);
  const latam = tallyCountries(rows, LATAM_ISO);
  assert.equal(world.shops, 4903);
  assert.equal(latam.shops, 103);
  assert.ok(latam.shops < world.shops);
});
