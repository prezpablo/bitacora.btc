import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { browserHosts, cspHttpsHosts, THIRD_PARTIES } from "./third-parties.ts";

test("every CSP host has a third-party card", () => {
  const caddy = readFileSync(new URL("../../deploy/Caddyfile", import.meta.url), "utf8");
  const m = caddy.match(/Content-Security-Policy "([^"]+)"/);
  assert.ok(m);
  const csp = cspHttpsHosts(m[1]).sort();
  const cards = browserHosts();
  assert.deepEqual(cards, csp);
});

test("GitHub and Gmail are not under the list that receives no personal data", () => {
  const named = THIRD_PARTIES.filter((p) => p.name === "GitHub" || p.name === "Google (Gmail)");
  assert.equal(named.length, 2);
  for (const p of named) assert.equal(p.side, "recipient");
  const server = THIRD_PARTIES.filter((p) => p.side === "server").map((p) => p.name);
  assert.ok(!server.some((n) => /GitHub|Gmail/.test(n)));
});
