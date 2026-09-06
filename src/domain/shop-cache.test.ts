import assert from "node:assert/strict";
import { test } from "node:test";
import type { MerchantPlace } from "./entities.ts";
import {
  boxContains,
  quantizeBox,
  rememberShopBox,
  shopsFromCache,
  shopsInView,
  type ShopBbox,
} from "./shop-cache.ts";

const box = (w: number, s: number, e: number, n: number): ShopBbox => ({ west: w, south: s, east: e, north: n });
const shop = (id: string, lat: number, lon: number): MerchantPlace => ({
  id,
  lat,
  lon,
  name: id,
  category: "cafe",
  createdAt: 1,
});

test("zoom-in view is contained by the parent box", () => {
  const parent = box(-56.3, -35, -55.9, -34.7);
  const inner = box(-56.2, -34.95, -56.0, -34.8);
  assert.equal(boxContains(parent, inner), true);
  assert.equal(boxContains(inner, parent), false);
});

test("quantizeBox keeps nearby pans on the same key", () => {
  const a = quantizeBox(box(-56.171, -34.908, -56.150, -34.890));
  const b = quantizeBox(box(-56.168, -34.905, -56.148, -34.888));
  assert.deepEqual(a, b);
});

test("cache hit on zoom-in filters shops; zoom-out misses", () => {
  const parent = box(-56.4, -35.1, -55.8, -34.6);
  const shops = [shop("in", -34.9, -56.16), shop("out", -33.0, -56.16)];
  const cache = rememberShopBox([], parent, shops, 1_000);
  const inner = box(-56.2, -34.95, -56.1, -34.85);
  const hit = shopsFromCache(cache, inner, 1_500);
  assert.ok(hit);
  assert.equal(hit!.some((p) => p.id === "in"), true);
  assert.equal(hit!.some((p) => p.id === "out"), false);
  const wider = box(-58, -36, -54, -33);
  assert.equal(shopsFromCache(cache, wider, 1_500), null);
});

test("expired boxes are ignored", () => {
  const parent = box(-56.4, -35.1, -55.8, -34.6);
  const cache = rememberShopBox([], parent, [shop("a", -34.9, -56.16)], 1_000);
  assert.equal(shopsFromCache(cache, parent, 1_000 + 61_000), null);
});

test("shopsInView keeps a small pad at the edge", () => {
  const view = box(-56.2, -34.95, -56.1, -34.85);
  const edge = shop("edge", -34.85, -56.2);
  assert.equal(shopsInView([edge], view).length, 1);
});
