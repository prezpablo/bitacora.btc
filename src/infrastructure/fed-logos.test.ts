import assert from "node:assert/strict";
import { test } from "node:test";
import { fedLogoFile, fedLogoName } from "./fed-logos.ts";

test("community logo file name stays inside the folder", () => {
  assert.equal(fedLogoName("btcmap:2140"), "btcmap-2140.jpg");
  assert.equal(fedLogoFile("btcmap-2140.jpg").endsWith("/data/logos/fed/btcmap-2140.jpg"), true);
  assert.equal(fedLogoFile("../btcmap-2140.jpg"), "");
  assert.equal(fedLogoFile("btcmap-2140.png"), "");
  assert.equal(fedLogoFile("btcmap-2140.jpg/../../etc/passwd"), "");
});
