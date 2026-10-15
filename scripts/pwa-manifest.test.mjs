import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { injectGrokPwaHead } from "./grok-pwa-shared.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("D-PWA static manifest is first-party", () => {
  const man = JSON.parse(readFileSync(join(root, "public/manifest.webmanifest"), "utf8"));
  assert.equal(man.name, "Bitácora.btc");
  assert.match(man.icons[0].src, /^\/icon-180\.png$/);
  assert.doesNotMatch(man.icons[0].src, /__grok/);
  const head = readFileSync(join(root, "src/routes/__root.tsx"), "utf8");
  assert.match(head, /href: "\/manifest\.webmanifest"/);
  assert.match(head, /href: "\/icon-180\.png"/);
  assert.doesNotMatch(head, /\/__grok\//);
});

test("injector does not add /__grok/manifest if a manifest already exists", () => {
  const html = '<html><head><link rel="manifest" href="/manifest.webmanifest"></head></html>';
  const out = injectGrokPwaHead(html);
  assert.equal((out.match(/rel="manifest"/g) || []).length, 1);
  assert.doesNotMatch(out, /__grok\/manifest/);
});

test("L-MANIF published host drops extensions.js; preview keeps it", () => {
  const dirty =
    '<html><head><link rel="manifest" href="/manifest.webmanifest"><script src="https://grok.com/grok-app-builder/extensions.js" defer></script></head></html>';
  const org = injectGrokPwaHead(dirty, { host: "bitacorabtc.org" });
  assert.equal((org.match(/rel="manifest"/g) || []).length, 1);
  assert.doesNotMatch(org, /extensions\.js/);
  const preview = injectGrokPwaHead('<html><head></head></html>', { host: "localhost:8080" });
  assert.match(preview, /__grok\/manifest/);
  assert.match(preview, /extensions\.js/);
});
