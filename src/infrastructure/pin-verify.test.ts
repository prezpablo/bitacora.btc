import assert from "node:assert/strict";
import { test } from "node:test";
import { scrapeMirrors } from "./pin-verify.ts";

test("Instagram posts go through InstaFix (ddinstagram) not the login wall", () => {
  const m = scrapeMirrors("https://www.instagram.com/p/AbC123/");
  assert.ok(m.some((u) => u.includes("ddinstagram.com/p/AbC123")));
  assert.ok(m.some((u) => u.includes("embed/captioned")));
});

test("Instagram profiles use InstaFix plus the bio link (ink.bio)", () => {
  const m = scrapeMirrors("https://instagram.com/consciencia.btc");
  assert.ok(m.some((u) => u.includes("ddinstagram.com/consciencia.btc")));
  assert.ok(m.some((u) => u.includes("ink.bio/consciencia.btc")));
});
