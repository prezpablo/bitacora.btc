import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { addrHint, bech32CharsetOk, bech32Ok, CONTRIBUTE_BOLT12, CONTRIBUTE_ONCHAIN, contributeValid } from "./contribute.ts";

test("on-chain P2WPKH checksum", () => {
  assert.equal(bech32Ok(CONTRIBUTE_ONCHAIN, "bc"), true);
  assert.equal(contributeValid("onchain"), true);
  assert.equal(bech32Ok(CONTRIBUTE_ONCHAIN.slice(0, -1) + "s", "bc"), false);
});

test("BOLT12 offer shape (charset; checksum largo no es BIP-173)", () => {
  assert.equal(bech32CharsetOk(CONTRIBUTE_BOLT12, "lno", 80), true);
  assert.equal(contributeValid("ln"), true);
  assert.equal(bech32CharsetOk("lnbc1xyz", "lno"), false);
});

test("hint shows both ends", () => {
  const h = addrHint(CONTRIBUTE_ONCHAIN);
  assert.match(h, /^bc1qe2f3/);
  assert.match(h, /kk83t$/);
  assert.ok(h.includes("…"));
});

test("QR files exist and are PNG", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
  for (const name of ["contribuir-qr.png", "contribuir-ln.png"]) {
    const buf = readFileSync(join(root, "public", name));
    assert.equal(buf[0], 0x89);
    assert.equal(buf[1], 0x50);
    assert.ok(buf.length > 2000);
  }
});
