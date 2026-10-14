import assert from "node:assert/strict";
import { test } from "node:test";
import { publicBrandAllowed, publicRowStarred } from "./patch-star.ts";

const links = [
  { key: "web", url: "https://cafe.example" },
  { key: "x", url: "https://x.com/cafe" },
];

test("S-PATCH la estrella cierra logo y redes, el token CARGA las abre", () => {
  const fed = { id: "btcmap:9", score: 0, votes: 0, verifiedAt: 0 };
  assert.equal(publicRowStarred(fed, links), true);
  assert.equal(publicBrandAllowed(true, "CARGA-ABC", ""), false);
  assert.equal(publicBrandAllowed(true, "CARGA-ABC", "CARGA-ABC"), true);
  assert.equal(publicRowStarred(fed, []), false);
  assert.equal(publicBrandAllowed(false, "", "no"), true);
  assert.equal(publicRowStarred({ id: "btcmap:9", score: 4, votes: 3, verifiedAt: 0 }, []), true);
  assert.equal(publicRowStarred({ id: "local:-34.9,-56.1", score: 5, votes: 9, verifiedAt: 0 }, links), false);
  assert.equal(publicRowStarred({ id: "local:-34.9,-56.1", score: 0, votes: 0, verifiedAt: 1 }, []), true);
  assert.equal(publicRowStarred({ id: "c:cc-btc", score: 0, votes: 0, verifiedAt: 0 }, []), true);
});
