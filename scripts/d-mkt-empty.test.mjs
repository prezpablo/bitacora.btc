import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

test("D-MKT empty extras return null; price chart stays", () => {
  assert.match(read("src/components/dashboard/etf-flow.tsx"), /if \(!data\?\.series\?\.length\) return null/);
  assert.match(read("src/components/dashboard/fear-greed-panel.tsx"), /if \(!data\) return null/);
  assert.match(read("src/components/dashboard/liquidity-panel.tsx"), /if \(!data\) return null/);
  assert.match(read("src/components/dashboard/clarity-panel.tsx"), /if \(!data\) return null/);
  assert.match(read("src/components/dashboard/onchain-panel.tsx"), /if \(!data\) return null/);
  const desk = read("src/components/dashboard/desk.tsx");
  assert.match(desk, /<PriceChart/);
  assert.match(desk, /statPrice/);
  assert.match(desk, /OnchainLiveBar/);
});
