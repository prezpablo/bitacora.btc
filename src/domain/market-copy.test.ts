import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the weekly control point does not say the price sweeps shorts or longs", () => {
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  const desk = readFileSync(new URL("../components/dashboard/desk.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(i18n, /barre shorts|barre longs|sweeps shorts|sweeps longs|varre shorts|varre longs/);
  assert.doesNotMatch(desk, /pocUp|pocDown/);
  assert.match(desk, /pocBody/);
});
