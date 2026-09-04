import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogShopsInBox, replaceCatalog } from "./catalog.ts";

test("catalog bbox returns seeded shops and skips outsiders", () => {
  replaceCatalog(
    [
      { id: "test:uy-cat", lat: -34.9, lon: -56.16, name: "MVD Cafe", category: "cafe", createdAt: 1 },
      { id: "test:ar-cat", lat: -34.6, lon: -58.38, name: "CABA", category: "shop", createdAt: 1 },
    ],
    [],
    false,
  );
  const mvd = catalogShopsInBox({ west: -56.4, south: -35.1, east: -55.9, north: -34.7 });
  assert.ok(mvd.some((p) => p.id === "test:uy-cat"));
  assert.ok(!mvd.some((p) => p.id === "test:ar-cat"));
});
