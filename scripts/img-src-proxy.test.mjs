import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

test("D-CSP-IMG imgSrc proxies remote URLs through /logo", () => {
  const src = read("src/domain/map-csv.ts");
  assert.match(src, /\/logo\?u=\$\{encodeURIComponent/);
  assert.match(src, /MAP_IMG_HOST/);
  assert.match(src, /btcmap\.org/);
  assert.match(src, /u\.startsWith\("\/"\) \|\| u\.startsWith\("data:"\)/);
  const events = read("src/components/dashboard/network-events.tsx");
  assert.match(events, /eventFlyerSrc\(ev\.image\)/);
  assert.match(events, /object-cover/);
  const flyer = read("src/domain/map-csv.ts");
  assert.match(flyer, /export function eventFlyerSrc/);
  assert.match(flyer, /FLYER_HOST/);
  assert.match(flyer, /lumaFlyerUrl/);
  assert.match(flyer, /width=540,height=675/);
  const eventsUi = read("src/components/dashboard/network-events.tsx");
  assert.match(eventsUi, /object-cover/);
  assert.match(eventsUi, /objectPosition: "center center"/);
  assert.match(eventsUi, /aspect-\[4\/5\]/);
  const caddy = read("deploy/Caddyfile");
  assert.match(caddy, /img-src 'self'/);
  assert.doesNotMatch(caddy, /img-src[^"]*\shttps:\s/);
  assert.match(caddy, /images\.lumacdn\.com/);
  assert.match(caddy, /meetupstatic\.com/);
  assert.match(caddy, /tiles\.openfreemap\.org/);
  assert.match(caddy, /tile\.opentopomap\.org/);
  const logo = read("server/routes/logo.get.ts");
  assert.match(logo, /MAX = 2_000_000/);
  assert.match(logo, /img\.evbuc\.com/);
  assert.match(logo, /images\.lumacdn\.com\/cdn-cgi\/image\/width=540,height=675,fit=cover,gravity=center,quality=72,format=jpeg/);
  assert.match(logo, /fit: "cover"/);
  assert.match(logo, /position: "centre"/);
  assert.match(logo, /isSvgPayload/);
  assert.match(logo, /limitInputPixels: PIXELS/);
  assert.match(logo, /default-src 'none'; sandbox/);
  assert.match(logo, /readAtMost/);
  assert.match(caddy, /@logo path \/logo\*/);
  assert.match(caddy, /default-src 'none'; sandbox/);
});

test("smoke diario cubre /logo, img-src y Luma compacto", () => {
  const smoke = read("docs/SMOKE-DIARIO.md");
  assert.match(smoke, /\/logo/);
  assert.match(smoke, /img-src/);
  assert.match(smoke, /btcmap-shops/);
  assert.match(smoke, /127\.0\.0\.1/);
  const live = read("scripts/probe-live.mjs");
  assert.match(live, /P2-20 img-src allowlist/);
  assert.match(live, /P0-25 \/logo Luma JPEG/);
  assert.match(live, /127\.0\.0\.1/);
});
