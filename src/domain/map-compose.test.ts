import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_HOURS } from "./hours.ts";
import { draftCommunity, draftShop, localShopId, rateLocal, slugifyName } from "./map-compose.ts";

test("local shop id is a coordinate key", () => {
  assert.equal(localShopId(-34.47123, -57.84611), "local:-34.47123,-57.84611");
});

test("slugify strips accents", () => {
  assert.equal(slugifyName("Consciencia Bitcoin"), "consciencia-bitcoin");
});

test("draft shop is a propuesta with one vote", () => {
  const out = draftShop(
    { lat: -34.47, lon: -57.84 },
    {
      name: "Café ₿",
      description: "ln",
      notes: "",
      hours: EMPTY_HOURS,
      pays: ["ln"],
      address: "18 de Julio 1, Colonia",
      logo: "",
      links: [],
      stars: 5,
      nick: "pablo",
    },
    1,
  );
  if ("error" in out) throw new Error(out.error);
  assert.equal(out.place.category, "propuesta");
  assert.equal(out.local.voteCount, 1);
  assert.equal(out.local.votes[0]?.by, "pablo");
});

test("community slug cannot collide", () => {
  const miss = draftCommunity({ lat: 0, lon: 0 }, { slug: "cc-btc", name: "X", description: "", logo: "", links: [] }, [
    "cc-btc",
  ]);
  assert.deepEqual(miss, { error: "slugTaken" });
});

test("rate local keeps description if the draft is empty", () => {
  const next = rateLocal(
    { description: "old", votes: [], listedAt: 1, score: 0, voteCount: 0 },
    4,
    "ana",
    "",
    2,
  );
  assert.equal(next.description, "old");
  assert.equal(next.voteCount, 1);
  assert.equal(next.votes[0]?.stars, 4);
});
