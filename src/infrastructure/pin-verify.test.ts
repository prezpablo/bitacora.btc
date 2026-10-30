import assert from "node:assert/strict";
import { test } from "node:test";
import { scrapeMirrors } from "./pin-verify.ts";

test("Instagram posts go through a reader of the public embed, not the login wall", () => {
  const m = scrapeMirrors("https://www.instagram.com/p/AbC123/?srtk=abc");
  assert.equal(m[0], "https://r.jina.ai/https://www.instagram.com/p/AbC123/embed/captioned/");
  assert.ok(m.some((u) => u.includes("embed/captioned")));
  assert.ok(m.some((u) => u.includes("ddinstagram.com/p/AbC123")));
});

test("an X status link drops the tracking query and uses FixTweet", () => {
  const m = scrapeMirrors("https://x.com/OkPabloPerez/status/2115998481739563365?s=20");
  assert.equal(m[0], "https://api.fxtwitter.com/OkPabloPerez/status/2115998481739563365");
  assert.ok(m.some((u) => u.includes("api.vxtwitter.com/OkPabloPerez/status/2115998481739563365")));
  assert.ok(m.every((u) => !u.includes("s=20")));
});

test("Instagram profiles use InstaFix plus the bio link (ink.bio)", () => {
  const m = scrapeMirrors("https://instagram.com/consciencia.btc");
  assert.ok(m.some((u) => u.includes("ddinstagram.com/consciencia.btc")));
  assert.ok(m.some((u) => u.includes("ink.bio/consciencia.btc")));
});
