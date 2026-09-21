import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadCola, runDeuda } from "./deuda-status.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("cola JSON has unique ids and a resume date", () => {
  const doc = loadCola(readFileSync(join(ROOT, "docs/deuda-cola.json"), "utf8"));
  assert.match(doc.resume, /^2026-09-21$/);
  const ids = doc.items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("D-FOSS") && ids.includes("D-PIN-03+"));
  assert.ok(doc.guards.some((g) => g.id === "G-HEALTHZ"));
});

test("repo probes: PIN-01 closed, FOSS still open", async () => {
  const { rows } = await runDeuda({ live: false });
  const pin = rows.find((r) => r.id === "D-PIN-01");
  const foss = rows.find((r) => r.id === "D-FOSS");
  const pwa = rows.find((r) => r.id === "D-PWA");
  assert.equal(pin.state, "CERRADO");
  assert.equal(foss.state, "ABIERTO");
  assert.equal(pwa.state, "CERRADO");
});

test("guards are not run without --live", async () => {
  const { guards } = await runDeuda({ live: false });
  assert.equal(guards.length, 0);
});
