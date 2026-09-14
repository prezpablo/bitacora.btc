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

test("pinAsPlace uses the shop name, not the BTC Map other tag", () => {
  const a = pinAsPlace({ id: "node:1", lat: -34.89, lon: -56.16, icon: "other", name: "Roderichs Crypto House" });
  assert.equal(a.name, "Roderichs Crypto House");
  assert.equal(a.category, "lugar");
  const b = pinAsPlace({ id: "y", lat: 1, lon: 2, name: "Cafe", category: "cafe", createdAt: 1 });
  assert.equal(b.name, "Cafe");
});