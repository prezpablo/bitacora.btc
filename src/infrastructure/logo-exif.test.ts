import assert from "node:assert/strict";
import sharp from "sharp";
import { test } from "node:test";
import { sanitizePatchFields } from "../domain/listing-patch.ts";
import { jpegWithoutExif, rewriteDataLogo } from "./logo-exif.ts";

test("D-EXIF a rewritten JPEG drops EXIF and a data logo is rewritten before it is stored", async () => {
  const src = await sharp({
    create: { width: 12, height: 8, channels: 3, background: { r: 247, g: 147, b: 26 } },
  })
    .jpeg()
    .withMetadata({ exif: { IFD0: { ImageDescription: "gps-should-not-survive" } } })
    .toBuffer();
  const before = await sharp(src).metadata();
  assert.ok(before.exif);
  const out = await jpegWithoutExif(src, false);
  const after = await sharp(out).metadata();
  assert.equal(after.exif, undefined);
  const data = `data:image/jpeg;base64,${src.toString("base64")}`;
  const next = await rewriteDataLogo(data);
  assert.match(next, /^data:image\/jpeg;base64,/);
  const stored = Buffer.from(next.slice(next.indexOf(",") + 1), "base64");
  assert.equal((await sharp(stored).metadata()).exif, undefined);
  assert.equal(await rewriteDataLogo("data:image/svg+xml;base64," + Buffer.from("<svg></svg>").toString("base64")), "");
  assert.equal(await rewriteDataLogo("https://example.com/a.png"), "https://example.com/a.png");
  assert.equal(sanitizePatchFields({ logo: "data:image/png;base64,aaaa" }).logo, "");
  assert.equal(sanitizePatchFields({ logo: next }).logo, next);
});
