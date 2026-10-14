import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { STATUES } from "./statues.ts";

test("only the installed statues with a photo are pinned", () => {
  assert.deepEqual(
    STATUES.map((s) => s.id),
    ["budapest", "el-zonte"],
  );
  for (const s of STATUES) {
    assert.equal(existsSync(new URL(`../../public${s.img}`, import.meta.url)), true);
  }
  const globe = readFileSync(new URL("../components/map/world-globe.tsx", import.meta.url), "utf8");
  const map = readFileSync(new URL("../components/map/spend-map.tsx", import.meta.url), "utf8");
  assert.match(globe, /STATUES/);
  assert.match(map, /STATUES/);
});
