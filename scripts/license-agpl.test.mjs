import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("D-LIC AGPL-3.0 at repo root and /LICENSE", () => {
  const lic = readFileSync(join(root, "LICENSE"), "utf8");
  assert.match(lic, /GNU AFFERO GENERAL PUBLIC LICENSE/);
  assert.match(lic, /Version 3, 19 November 2007/);
  assert.equal(existsSync(join(root, "public/LICENSE")), true);
  const legal = readFileSync(join(root, "src/domain/legal-eu.ts"), "utf8");
  assert.match(legal, /id: "codigo"/);
  assert.match(legal, /AGPL-3\.0/);
  const nf = readFileSync(join(root, "src/lib/error-component.tsx"), "utf8");
  assert.match(nf, /href="\/LICENSE"/);
});
