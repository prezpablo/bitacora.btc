import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, summarize } from "./probe-a11y.mjs";

test("map contrast is MAPA noise, not a site FAIL", () => {
  assert.equal(
    classify({ id: "color-contrast", impact: "serious", nodes: [{ target: [".leaflet-container"] }] }, "/mapa"),
    "mapa",
  );
  assert.equal(classify({ id: "button-name", impact: "critical", nodes: [{ target: ["button"] }] }, "/legal"), "fail");
  assert.equal(classify({ id: "region", impact: "moderate", nodes: [{ target: ["div"] }] }, "/"), "warn");
});

test("summarize buckets axe violations", () => {
  const out = summarize(
    {
      violations: [
        { id: "label", impact: "critical", help: "Form elements must have labels", tags: ["wcag2a"], nodes: [{ target: ["input"] }] },
        { id: "color-contrast", impact: "serious", help: "Contrast", tags: ["wcag2aa"], nodes: [{ target: [".leaflet-control"] }] },
      ],
      passes: [1, 2],
      incomplete: [1],
    },
    "/mapa",
  );
  assert.equal(out.fail.length, 1);
  assert.equal(out.mapa.length, 1);
  assert.equal(out.passes, 2);
});
