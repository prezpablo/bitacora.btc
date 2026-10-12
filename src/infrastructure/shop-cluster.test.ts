import assert from "node:assert/strict";
import { test } from "node:test";
import { loadShopIndex, placesFromClusters } from "./shop-cluster.ts";
import { isShopCluster, pinAsPlace } from "../domain/entities.ts";
import type { ShopPin } from "@/domain";

const shop = (id: string, lat: number, lon: number): ShopPin => ({
  id,
  lat,
  lon,
  icon: "cafe",
  name: id,
});

test("isShopCluster detects cluster placeholders", () => {
  assert.equal(isShopCluster({ id: "cluster:9", icon: "cluster", clusterCount: 12 }), true);
  assert.equal(isShopCluster({ id: "btcmap:1", icon: "cafe" }), false);
});

test("continent zoom clusters nearby shops; street zoom lists them", () => {
  const shops = Array.from({ length: 24 }, (_, i) => shop(`s${i}`, -34.9 + i * 0.0008, -56.16 + i * 0.0008));
  const index = loadShopIndex(shops);
  const box: [number, number, number, number] = [-56.3, -35.05, -56.0, -34.75];
  const far = placesFromClusters(index, box, 4);
  const near = placesFromClusters(index, box, 16);
  assert.ok(far.length < shops.length, `far ${far.length} vs ${shops.length}`);
  assert.ok(far.some((p) => p.icon === "cluster"));
  assert.equal(
    near.filter((p) => p.icon !== "cluster").length,
    shops.length,
  );
  const leaf = near.find((p) => p.icon !== "cluster");
  assert.ok(leaf);
  assert.ok(leaf!.name);
  assert.equal(leaf!.icon, "cafe");
});

test("the same shop copied many times is one ficha, not a 150", () => {
  const copies = Array.from({ length: 150 }, (_, i) => ({
    ...shop(i % 3 === 0 ? "node:3454449533" : `osm:node:${3454449533 + (i % 3 === 1 ? 0 : i)}`, -34.90567, -56.20469),
    name: "Café Brasilero",
  }));
  const index = loadShopIndex(copies);
  const bay: [number, number, number, number] = [-56.25, -34.95, -56.15, -34.86];
  const pins = placesFromClusters(index, bay, 14);
  assert.equal(pins.length, 1);
  assert.equal(pins[0]?.icon, "cafe");
  assert.equal(pins.some((p) => (p.clusterCount ?? 0) >= 2), false);
});

test("a cluster number never counts shops outside the bay", () => {
  const mvd = Array.from({ length: 8 }, (_, i) => shop(`mvd${i}`, -34.90 + i * 0.002, -56.17 + i * 0.002));
  const ba = Array.from({ length: 94 }, (_, i) => shop(`ba${i}`, -34.60 + (i % 10) * 0.004, -58.42 + Math.floor(i / 10) * 0.004));
  const index = loadShopIndex([...mvd, ...ba]);
  const street: [number, number, number, number] = [-56.22, -34.93, -56.12, -34.87];
  const atStreet = placesFromClusters(index, street, 14);
  assert.ok(atStreet.every((p) => p.icon !== "cluster" || (p.clusterCount ?? 0) <= mvd.length));
  assert.ok(
    atStreet.filter((p) => p.icon !== "cluster").length <= mvd.length,
    `street leaves ${atStreet.length}`,
  );
  const far = placesFromClusters(index, street, 8);
  const fat = far.find((p) => (p.clusterCount ?? 0) > 20);
  assert.equal(fat, undefined, "MVD box must not inherit BA cluster size");
});

test("pinAsPlace uses the shop name, not the BTC Map other tag", () => {
  const a = pinAsPlace({ id: "node:1", lat: -34.89, lon: -56.16, icon: "other", name: "Roderichs Crypto House" });
  assert.equal(a.name, "Roderichs Crypto House");
  assert.equal(a.category, "atm");
  const m = pinAsPlace({ id: "node:2", lat: -34.9, lon: -56.2, icon: "other", name: "El Minisuper De Las Piedras" });
  assert.equal(m.name, "El Minisuper De Las Piedras");
  assert.equal(m.category, "shop");
  const b = pinAsPlace({ id: "y", lat: 1, lon: 2, name: "Cafe", category: "cafe", createdAt: 1 });
  assert.equal(b.name, "Cafe");
});