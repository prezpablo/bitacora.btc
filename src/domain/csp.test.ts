import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CSP_POLICY, cspWithScriptNonce } from "./csp.ts";

const NONCE = "abcDEF123_-xyz890";

test("S-CSP-NONCE drops unsafe-inline only from script-src", () => {
  const next = cspWithScriptNonce(CSP_POLICY, NONCE);
  assert.match(next, new RegExp(`script-src 'self' 'wasm-unsafe-eval' 'nonce-${NONCE}'`));
  assert.doesNotMatch(next.split(";")[1] || "", /unsafe-inline/);
  assert.match(next, /style-src 'self' 'unsafe-inline'/);
  assert.match(next, /form-action 'self' https:\/\/formsubmit\.co/);
  assert.match(next, /images\.lumacdn\.com/);
  assert.match(next, /tiles\.openfreemap\.org/);
});

test("S-CSP-NONCE rejects a nonce that could break the header", () => {
  assert.equal(cspWithScriptNonce(CSP_POLICY, "bad nonce"), CSP_POLICY);
  assert.equal(cspWithScriptNonce(CSP_POLICY, "'self'"), CSP_POLICY);
});

test("Caddy does not overwrite the app CSP", () => {
  const caddy = readFileSync(new URL("../../deploy/Caddyfile", import.meta.url), "utf8");
  assert.equal(caddy.includes(CSP_POLICY), false);
  assert.match(caddy, /header \{\s*# [^\n]*\n\s*defer\n\s*-Server/);
  assert.match(caddy, /header @logo \{\s*defer\s*Content-Security-Policy "default-src 'none'; sandbox"/);
});
