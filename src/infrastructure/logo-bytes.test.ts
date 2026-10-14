import assert from "node:assert/strict";
import { test } from "node:test";
import { isSvgPayload } from "./logo-bytes.ts";

test("S-SVG un SVG no se confunde con una foto", () => {
  const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
  assert.equal(isSvgPayload("image/svg+xml", svg), true);
  assert.equal(isSvgPayload("application/octet-stream", svg), true);
  assert.equal(isSvgPayload("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xd9])), false);
  assert.equal(isSvgPayload("image/png", Buffer.from("\x89PNG\r\n\x1a\nrest")), false);
});
