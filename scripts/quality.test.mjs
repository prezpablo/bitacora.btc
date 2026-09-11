import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "quality.mjs"), "utf8");
const pkg = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../package.json"), "utf8");

test("quality gate lists test, lint:core, auth, deuda", () => {
  for (const id of ["test", "lint:core", "check:auth", "deuda"]) {
    assert.match(src, new RegExp(`id: "${id}"`));
  }
  assert.match(src, /id: "typecheck"/);
  assert.match(pkg, /"quality":/);
  assert.match(pkg, /"lint:core":/);
});
