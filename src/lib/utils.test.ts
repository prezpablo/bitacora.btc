import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeHtml, leafletImg } from "./utils.ts";

test("escapeHtml stops attribute breakouts", () => {
  const out = escapeHtml(`<img src="x" onerror="alert(1)">`);
  assert.equal(out.includes("<"), false);
  assert.equal(out.includes(">"), false);
  assert.equal(out.includes('"'), false);
  assert.equal(escapeHtml("Panadería"), "Panadería");
});

test("leafletImg drops scriptable sources", () => {
  assert.equal(leafletImg("/logos/economia-circular.png"), "/logos/economia-circular.png");
  assert.equal(leafletImg("https://static.btcmap.org/a.png"), "https://static.btcmap.org/a.png");
  assert.equal(leafletImg(`javascript:alert(1)`), "");
  assert.equal(leafletImg(`data:image/svg+xml,<svg onload=alert(1)>`), "");
  assert.equal(leafletImg(`https://evil.example/x.png`), "");
});
