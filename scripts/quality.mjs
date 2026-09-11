#!/usr/bin/env node
/**
 * Gate local de calidad. No sustituye el smoke del .org.
 * Falla si tests, lint de dominio/aplicación o el invariante auth fallan.
 * typecheck y eslint global son D-QA (informativos hasta que el tsc esté limpio).
 *
 *   node scripts/quality.mjs
 *   node scripts/quality.mjs --full
 */
import { spawnSync } from "node:child_process";

const FULL = process.argv.includes("--full");

const GATE = [
  { id: "test", cmd: ["npm", "test"] },
  { id: "lint:core", cmd: ["npx", "eslint", "src/domain", "src/application", "scripts/deuda-status.mjs", "scripts/quality.mjs"] },
  { id: "check:auth", cmd: ["npm", "run", "check:auth"] },
  { id: "deuda", cmd: ["node", "scripts/deuda-status.mjs"] },
];

const INFO = [
  { id: "typecheck", cmd: ["npx", "tsc", "--noEmit", "--pretty", "false"] },
  { id: "lint:all", cmd: ["npx", "eslint", ".", "--max-warnings", "0"] },
];

function run(step) {
  const r = spawnSync(step.cmd[0], step.cmd.slice(1), { encoding: "utf8", env: process.env });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const pass = r.status === 0;
  const tail = out.trim().split("\n").slice(-2).join(" · ").slice(0, 160);
  return { id: step.id, pass, status: r.status ?? 1, tail };
}

console.log(`quality · full=${FULL ? "sí" : "no"}`);
let fail = 0;
for (const step of GATE) {
  const r = run(step);
  if (!r.pass) fail += 1;
  console.log(`${r.pass ? "OK  " : "FAIL"}  ${r.id.padEnd(12)} ${r.tail || `exit ${r.status}`}`);
}
if (FULL) {
  for (const step of INFO) {
    const r = run(step);
    console.log(`${r.pass ? "OK  " : "DEGRADA"}  ${r.id.padEnd(12)} ${r.tail || `exit ${r.status}`} (D-QA)`);
  }
}
if (fail) process.exit(1);
