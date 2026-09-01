import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeHtml } from "./utils.ts";

test("escapeHtml stops attribute breakouts", () => {
  const out = escapeHtml(`<img src="x" onerror="alert(1)">`);
  assert.equal(out.includes("<"), false);
  assert.equal(out.includes(">"), false);
  assert.equal(out.includes('"'), false);
  assert.equal(escapeHtml("Panadería"), "Panadería");
});
