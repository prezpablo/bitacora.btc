import assert from "node:assert/strict";
import { test } from "node:test";
import { communityIsPublic, communityTrust, listingTrust, normalizeProofUrl, shopIsPublic, overlayPending, cargaVerifyGate } from "./verify.ts";

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

test("overlay listing is not verified by two socials until CARGA is scraped", () => {
  const links = [
    { key: "web", url: "https://nodo.uy" },
    { key: "x", url: "https://x.com/nodo" },
  ];
  const open = listingTrust(links, 5, 4, false);
  assert.equal(open.identity, true);
  assert.equal(open.verified, true);
  const overlay = listingTrust(links, 5, 4, false, true);
  assert.equal(overlay.identity, true);
  assert.equal(overlay.verified, false);
  assert.equal(listingTrust(links, 5, 4, true, true).verified, true);
  const pending = communityTrust({
    id: "c:nodo-x",
    slug: "nodo-x",
    name: "Nodo",
    lat: 0,
    lon: 0,
    logo: "",
    description: "",
    links,
    createdAt: 1,
    verifiedAt: 0,
  });
  assert.equal(pending.verified, false);
});

test("normalizeProofUrl is empty until step 2", () => {
  assert.deepEqual(normalizeProofUrl(""), { error: "need" });
  assert.deepEqual(normalizeProofUrl("   "), { error: "need" });
});

test("normalizeProofUrl drops javascript and data", () => {
  assert.deepEqual(normalizeProofUrl("javascript:alert(1)"), { error: "links" });
  assert.deepEqual(normalizeProofUrl("data:text/html,x"), { error: "links" });
});

test("normalizeProofUrl allows Instagram post or reel, not bio", () => {
  const bio = normalizeProofUrl("https://instagram.com/nodo");
  assert.equal("error" in bio && bio.error, "instagram");
  const post = normalizeProofUrl("https://www.instagram.com/p/AbC123/");
  assert.equal("url" in post, true);
  const reel = normalizeProofUrl("https://www.instagram.com/reel/AbC123/");
  assert.equal("url" in reel, true);
});

test("overlayPending is only unverified local: or user c:", () => {
  assert.equal(overlayPending("local:-34.4,-57.8", 0), true);
  assert.equal(overlayPending("local:-34.4,-57.8", Date.now()), false);
  assert.equal(overlayPending("c:nodo-x", 0), true);
  assert.equal(overlayPending("c:nodo-x", 1), false);
  assert.equal(overlayPending("c:cc-btc", 0), false);
  assert.equal(overlayPending("btcmap:abc", 0), false);
  assert.equal(overlayPending("node:99", 0), false);
  assert.equal(overlayPending("osm:1", 0), false);
});

test("cargaVerifyGate requires matching token and never accepts catalog", () => {
  assert.equal(cargaVerifyGate(undefined, "CARGA-ABC"), "missing");
  assert.equal(cargaVerifyGate({ id: "btcmap:abc", token: "CARGA-ABC", verifiedAt: 0 }, "CARGA-ABC"), "live");
  assert.equal(cargaVerifyGate({ id: "c:cc-btc", token: "CARGA-ABC", verifiedAt: 0 }, "CARGA-ABC"), "live");
  assert.equal(cargaVerifyGate({ id: "local:-34.4,-57.8", token: "CARGA-ABC", verifiedAt: 1 }, "CARGA-ABC"), "live");
  assert.equal(cargaVerifyGate({ id: "local:-34.4,-57.8", verifiedAt: 0 }, "CARGA-ABC"), "token");
  assert.equal(cargaVerifyGate({ id: "local:-34.4,-57.8", token: "CARGA-ABC", verifiedAt: 0 }, ""), "token");
  assert.equal(cargaVerifyGate({ id: "local:-34.4,-57.8", token: "CARGA-ABC", verifiedAt: 0 }, "CARGA-XYZ"), "token");
  assert.equal(cargaVerifyGate({ id: "c:nodo-x", token: "CARGA-ABC", verifiedAt: 0 }, "CARGA-ABC"), "ok");
  assert.equal(cargaVerifyGate({ id: "local:-34.4,-57.8", token: "CARGA-ABC", verifiedAt: 0 }, "CARGA-ABC"), "ok");
});

