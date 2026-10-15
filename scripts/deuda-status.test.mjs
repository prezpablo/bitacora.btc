import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadCola, runDeuda } from "./deuda-status.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("cola JSON has unique ids and a resume date", () => {
  const doc = loadCola(readFileSync(join(ROOT, "docs/deuda-cola.json"), "utf8"));
  assert.match(doc.resume, /^2026-10-13$/);
  const ids = doc.items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("D-FOSS") && ids.includes("D-PIN-03+") && ids.includes("L-CONSENT"));
  assert.ok(doc.guards.some((g) => g.id === "G-HEALTHZ"));
});

test("repo probes: PIN-01 and the public footer commit are closed", async () => {
  const { rows } = await runDeuda({ live: false });
  const pin = rows.find((r) => r.id === "D-PIN-01");
  const foss = rows.find((r) => r.id === "D-FOSS");
  const pwa = rows.find((r) => r.id === "D-PWA");
  assert.equal(pin.state, "CERRADO");
  assert.equal(foss.state, "CERRADO");
  assert.match(foss.detail, /pie/);
  assert.equal(pwa.state, "CERRADO");
});

test("D-FOSS live does not close on a GitHub 200 without the footer hash", () => {
  const src = readFileSync(join(ROOT, "scripts/deuda-status.mjs"), "utf8");
  const vite = readFileSync(join(ROOT, "vite.config.ts"), "utf8");
  assert.match(src, /commit\\\/\[0-9a-f\]\{7\}[\s\S]{0,40}home\.text/);
  assert.match(vite, /D-FOSS: el build de bitacorabtc.org no tiene commit/);
});

test("D-GLOBE stays globe-first except a pending CARGA", () => {
  const gate = readFileSync(join(ROOT, "src/components/map/map-gate.tsx"), "utf8");
  assert.match(gate, /mapHasPendingCarga\(\) \? "map" : "globe"/);
  assert.match(gate, /if \(!mapHasPendingCarga\(\)\) setMode\("globe"\)/);
  assert.doesNotMatch(gate, /slowNet/);
});

test("guards are not run without --live", async () => {
  const { guards } = await runDeuda({ live: false });
  assert.equal(guards.length, 0);
});
