import assert from "node:assert/strict";
import { test } from "node:test";
import { dedupeShops, layoutCityLogos, pickListingLogo, placeTruePins } from "./community-dedupe.ts";

const mvd = { lat: -34.9011, lon: -56.1645 };
const santiago = { lat: -33.4489, lon: -70.6693 };

test("placeTruePins keeps distant cities on their CSV/BTC Map coordinates", () => {
  const laid = placeTruePins([
    { id: "c:mvd", name: "Consciencia", ...mvd, logo: "/logos/conciencia-bitcoin.png" },
    { id: "c:stgo", name: "Santiago", ...santiago },
  ]);
  const a = laid.find((p) => p.id === "c:mvd")!;
  const b = laid.find((p) => p.id === "c:stgo")!;
  assert.ok(Math.abs(a.lat - mvd.lat) < 1e-6);
  assert.ok(Math.abs(a.lon - mvd.lon) < 1e-6);
  assert.ok(Math.abs(b.lat - santiago.lat) < 1e-6);
});

test("placeTruePins does not fling a city cluster across the country", () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({
    id: `c:${i}`,
    name: `Nodo ${i}`,
    lat: mvd.lat,
    lon: mvd.lon,
  }));
  const laid = placeTruePins(rows);
  assert.ok(laid.length <= 1);
  for (const p of laid) {
    const dlat = (p.lat - mvd.lat) * 111_320;
    const dlon = (p.lon - mvd.lon) * 111_320 * Math.cos((mvd.lat * Math.PI) / 180);
    const m = Math.hypot(dlat, dlon);
    assert.ok(m < 160, `${p.id} moved ${m.toFixed(0)} m`);
    assert.ok(Math.abs(p.lat0 - mvd.lat) < 1e-6);
    assert.ok(Math.abs(p.lon0 - mvd.lon) < 1e-6);
  }
});

test("zoom-style degree gap of layoutCityLogos is what used to drift pins", () => {
  const rows = [
    { id: "a", name: "A", ...mvd },
    { id: "b", name: "B", lat: mvd.lat + 0.02, lon: mvd.lon + 0.02 },
  ];
  const drifted = layoutCityLogos(rows, 3.8);
  const trueLaid = placeTruePins(rows);
  const driftKm = Math.hypot((drifted[0].lat - mvd.lat) * 111, (drifted[0].lon - mvd.lon) * 111);
  assert.ok(driftKm > 50, "old zoom-4 gap moved pins tens of km");
  for (const p of trueLaid) {
    assert.ok(Math.hypot((p.lat - p.lat0) * 111_320, (p.lon - p.lon0) * 111_320) < 160);
  }
});

test("pickListingLogo prefers CSV over BTC Map", () => {
  assert.equal(pickListingLogo("/logos/local.png", "https://btcmap.org/icon.png"), "/logos/local.png");
  assert.equal(pickListingLogo("", "https://btcmap.org/icon.png"), "https://btcmap.org/icon.png");
  assert.equal(pickListingLogo("", ""), "");
});

test("dedupeShops keeps the BTC Map node over a local clone", () => {
  const out = dedupeShops([
    { id: "local:-34.90110,-56.16450", name: "Moshi Moshi", lat: -34.9011, lon: -56.1645 },
    { id: "node:123", name: "Moshi Moshi", lat: -34.90115, lon: -56.16455, logo: "https://x/a.png" },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.id, "node:123");
});

test("generic unnamed shops on the same corner become one pin", () => {
  const rows = Array.from({ length: 18 }, (_, i) => ({
    id: `node:${i}`,
    name: i % 2 ? "Comercio Bitcoin" : "Bitcoin",
    lat: mvd.lat + i * 0.00001,
    lon: mvd.lon + i * 0.00001,
  }));
  assert.equal(dedupeShops(rows).length, 1);
  assert.equal(placeTruePins(rows).length, 1);
});

test("two named shops a block apart stay two pins", () => {
  const out = dedupeShops([
    { id: "node:1", name: "Café Central", ...mvd },
    { id: "node:2", name: "Panadería Sur", lat: mvd.lat + 0.001, lon: mvd.lon },
  ]);
  assert.equal(out.length, 2);
});


