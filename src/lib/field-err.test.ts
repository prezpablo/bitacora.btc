import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fieldErr } from "./field-err.ts";

test("a field error is invalid and points at the alert", () => {
  assert.deepEqual(fieldErr("e1", false), {});
  assert.deepEqual(fieldErr("e1", true), { "aria-invalid": true, "aria-describedby": "e1" });
});

test("form alerts are tied to the field that failed", () => {
  const captcha = readFileSync(new URL("../components/map/captcha.tsx", import.meta.url), "utf8");
  const contact = readFileSync(new URL("../components/dashboard/contact.tsx", import.meta.url), "utf8");
  const compose = readFileSync(new URL("../components/map/map-compose-form.tsx", import.meta.url), "utf8");
  assert.match(captcha, /id=\{failId\} role="alert"/);
  assert.match(captcha, /fail \? failId/);
  assert.match(contact, /id=\{errId\} role="alert"/);
  assert.match(contact, /fieldErr\(errId, need\)/);
  assert.match(contact, /fieldErr\(errId, emailBad\)/);
  assert.match(compose, /id=\{errId\} role="alert"/);
  assert.match(compose, /fieldErr\(errId, nameBad\)/);
  const proof = readFileSync(new URL("../components/map/carga-proof-step.tsx", import.meta.url), "utf8");
  const step = proof.slice(proof.indexOf("export function CargaProofStep"), proof.indexOf("export function CargaPendingView"));
  assert.match(step, /const errId = useId\(\)/);
  assert.match(step, /fieldErr\(errId, Boolean\(err\)\)/);
  assert.match(step, /id=\{errId\}/);
  assert.match(step, /role="alert"/);
});
