import assert from "node:assert/strict";
import { test } from "node:test";
import { communityIsPublic, shopIsPublic } from "./verify.ts";

test("user shop is public only after scrape", () => {
  assert.equal(shopIsPublic("local:-34.4,-57.8", 0), false);
  assert.equal(shopIsPublic("local:-34.4,-57.8", Date.now()), true);
  assert.equal(shopIsPublic("node:99", 0), true);
});

test("user community is public only after scrape; catalog and founding are not gated", () => {
  assert.equal(communityIsPublic({ id: "c:nodo-x", slug: "nodo-x", verifiedAt: 0 }), false);
  assert.equal(communityIsPublic({ id: "c:nodo-x", slug: "nodo-x", verifiedAt: 1 }), true);
  assert.equal(communityIsPublic({ id: "btcmap:abc", slug: "abc" }), true);
  assert.equal(communityIsPublic({ id: "c:cc-btc", slug: "cc-btc" }), true);
});
