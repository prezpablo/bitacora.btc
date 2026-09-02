import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { readLast, setLastKnownDir, withLastKnown } from "./last-known.ts";

test("withLastKnown serves the last good payload when the source fails", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bitacora-last-"));
  setLastKnownDir(dir);
  try {
    const live = await withLastKnown("fg", async () => ({ value: 42, asOf: 1 }), (d) => d.value > 0);
    assert.equal(live.value, 42);
    assert.equal(readLast<{ value: number }>("fg")?.data.value, 42);

    const stale = await withLastKnown("fg", async () => {
      throw new Error("down");
    });
    assert.equal(stale.value, 42);
  } finally {
    setLastKnownDir(join(process.cwd(), "data"));
    rmSync(dir, { recursive: true, force: true });
  }
});
