import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { minePow, powPayload, powZeroBits } from "./pow.ts";

test("minePow finds a nonce the server hash would accept", async () => {
  const salt = "bitacora-test-salt";
  const bits = 10;
  const nonce = await minePow(salt, bits);
  assert.ok(nonce.length);
  const digest = createHash("sha256").update(powPayload(salt, nonce)).digest();
  assert.ok(powZeroBits(digest) >= bits);
});
