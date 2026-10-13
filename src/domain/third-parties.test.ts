import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { browserHosts, cspHttpsHosts } from "./third-parties.ts";

test("every CSP host has a third-party card", () => {
  const caddy = readFileSync(new URL("../../deploy/Caddyfile", import.meta.url), "utf8");
  const m = caddy.match(/Content-Security-Policy "([^"]+)"/);
  assert.ok(m);
  const csp = cspHttpsHosts(m[1]).sort();
  const cards = browserHosts();
  assert.deepEqual(cards, csp);
});
