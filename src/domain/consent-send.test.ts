import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { readSentConsent, safeIpHash, writeConsent, listConsent } from "../infrastructure/consent-log.ts";

test("a submission keeps the sent version and form, and drops a clear IP", () => {
  const ok = readSentConsent({ textVersion: "2.9", form: "shop" });
  assert.equal(ok.version, "2.9");
  assert.equal(ok.form, "shop");
  const bad = readSentConsent({ textVersion: "latest", form: "otro" });
  assert.equal(bad.version, "");
  assert.equal(bad.form, "");
  assert.equal(safeIpHash("203.0.113.8"), "");
  writeConsent({ kind: "shop", version: "2.9", ipHash: "203.0.113.8", ref: "c-1", created: Date.now() });
  const row = listConsent().find((r) => r.ref === "c-1");
  assert.equal(row?.version, "2.9");
  assert.equal(row?.kind, "shop");
  assert.equal(row?.ipHash, "");
});

test("each form sends the text version and its own name", () => {
  const files: [string, string][] = [
    ["../components/dashboard/contact.tsx", 'form: "contact"'],
    ["../components/map/spend-map.tsx", 'form: "shop"'],
    ["../components/map/spend-map.tsx", 'form: "community"'],
    ["../components/dashboard/community-pins.tsx", 'form: "pin"'],
    ["../components/dashboard/experiences.tsx", 'form: "experience"'],
    ["../components/map/map-patch-form.tsx", 'form: "patch"'],
  ];
  for (const [file, form] of files) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.match(src, /textVersion: LEGAL\.consentVersion/);
    assert.ok(src.includes(form), form);
  }
  const server = readFileSync(new URL("../infrastructure/server-fns.ts", import.meta.url), "utf8");
  assert.doesNotMatch(server, /recordConsent\("publish"/);
  assert.doesNotMatch(server, /recordConsent\("contact"/);
});
