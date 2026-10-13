import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LEGAL, legalFilled } from "./legal-config.ts";

test("legal config does not invent the controller", () => {
  assert.equal(legalFilled(LEGAL.controllerName), false);
  assert.equal(legalFilled(LEGAL.address), false);
  assert.equal(legalFilled(LEGAL.privacyEmail), true);
  assert.equal(LEGAL.consentVersion, "2.0");
});

test("publish consent is not the contact form", () => {
  const src = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  const blocks = [...src.matchAll(/consentPublishInfo:\n\s*"([^"]+)"/g)].map((m) => m[1]);
  const contacts = [...src.matchAll(/consentContactInfo:\n\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(blocks.length, 3);
  assert.equal(contacts.length, 3);
  for (const pub of blocks) {
    assert.doesNotMatch(pub, /FormSubmit|12 meses|12 months/);
    assert.match(pub, /GitHub/);
    assert.match(pub, /\{license\}/);
  }
  for (const row of contacts) assert.match(row, /FormSubmit/);
});
