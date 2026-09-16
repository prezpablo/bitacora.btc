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
  assert.match(src, /u\.startsWith\("\/"\) \|\| u\.startsWith\("data:"\)/);
  const events = read("src/components/dashboard/network-events.tsx");
  assert.match(events, /imgSrc\(ev\.image\)/);
  assert.match(events, /onError=\{\(\) => setImgFail\(true\)\}/);
  const logo = read("server/routes/logo.get.ts");
  assert.match(logo, /MAX = 2_000_000/);
  assert.match(logo, /img\.evbuc\.com/);
  const caddy = read("deploy/Caddyfile");
  assert.match(caddy, /img-src 'self'/);
  assert.doesNotMatch(caddy, /img-src[^"]*\shttps:\s/);
  assert.match(caddy, /tiles\.openfreemap\.org/);
  assert.match(caddy, /tile\.opentopomap\.org/);
});
