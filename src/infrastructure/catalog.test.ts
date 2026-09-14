import assert from "node:assert/strict";
import { test } from "node:test";

process.env.BITACORA_CATALOG_SYNC = "0";

import { catalogShopById, catalogShopsInBox, mergeNewCatalog, replaceCatalog } from "./catalog.ts";

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
  const one = catalogShopById("test:uy-cat");
  assert.equal(one?.name, "MVD Cafe");
  assert.equal(catalogShopById("cluster:1"), null);
});

test("weekly merge inserts only new ids and keeps existing", () => {
  replaceCatalog([{ id: "test:keep", lat: -34.9, lon: -56.16, name: "Viejo", category: "cafe", createdAt: 1 }], [], false);
  const nid = `test:new-${Date.now()}`;
  const added = mergeNewCatalog(
    [
      { id: "test:keep", lat: -34.91, lon: -56.17, name: "Renombrado", category: "cafe", createdAt: 2 },
      { id: nid, lat: -34.88, lon: -56.15, name: "Nuevo", category: "shop", createdAt: 3 },
    ],
    [],
  );
  assert.equal(added.addedShops, 1);
  const mvd = catalogShopsInBox({ west: -56.4, south: -35.1, east: -55.9, north: -34.7 });
  const keep = mvd.find((p) => p.id === "test:keep");
  const neu = mvd.find((p) => p.id === nid);
  assert.equal(keep?.name, "Viejo");
  assert.ok(neu);
  assert.equal(neu?.name, "Nuevo");
});
