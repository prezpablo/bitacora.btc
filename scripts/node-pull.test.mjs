import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const SCRIPT = new URL("../deploy/bitacora-node-pull.sh", import.meta.url);

function run(env) {
  return spawnSync("bash", [SCRIPT.pathname], { env: { ...process.env, ...env }, encoding: "utf8" });
}

test("the node pull does nothing until a private host exists", () => {
  const src = readFileSync(SCRIPT, "utf8");
  assert.match(src, /getblockchaininfo\|getmempoolinfo\|estimatesmartfee/);
  assert.doesNotMatch(src, /getwalletinfo|walletpassphrase|dumpprivkey/);
  assert.match(src, /\*"cloudflare"\*/);
  const empty = run({ BITACORA_NODE_HOST: "" });
  assert.equal(empty.status, 0);
  assert.match(empty.stdout, /No se arma el túnel/);
  for (const host of ["8.8.8.8", "bitacorabtc.org", "1.1.1.1", "100.1.1.1"]) {
    const bad = run({ BITACORA_NODE_HOST: host, BITACORA_NODE_USER: "u", BITACORA_NODE_PASS: "p" });
    assert.notEqual(bad.status, 0, host);
  }
  const noport = run({ BITACORA_NODE_HOST: "10.1.1.1", BITACORA_NODE_PORT: "8333", BITACORA_NODE_USER: "u", BITACORA_NODE_PASS: "p" });
  assert.notEqual(noport.status, 0);
});

test("a private host only asks the three read methods", () => {
  const dir = mkdtempSync(join(tmpdir(), "bitacora-node-"));
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const log = join(dir, "curl.log");
  writeFileSync(
    join(bin, "curl"),
    `#!/bin/sh
printf '%s\\n' "$*" >> ${JSON.stringify(log)}
method=$(printf '%s' "$*" | sed -n 's/.*method":"\\([a-z]*\\)".*/\\1/p')
printf '{"result":{"blocks":1,"method":"%s"}}\\n' "$method"
`,
  );
  spawnSync("chmod", ["+x", join(bin, "curl")]);
  const out = join(dir, "node-status.json");
  const res = run({
    PATH: `${bin}:${process.env.PATH}`,
    BITACORA_NODE_HOST: "10.7.0.2",
    BITACORA_NODE_USER: "lector",
    BITACORA_NODE_PASS: "no-en-el-repo",
    BITACORA_DATA: dir,
  });
  assert.equal(res.status, 0, res.stderr);
  const asked = readFileSync(log, "utf8");
  assert.match(asked, /getblockchaininfo/);
  assert.match(asked, /getmempoolinfo/);
  assert.match(asked, /estimatesmartfee/);
  assert.doesNotMatch(asked, /wallet/);
  const saved = JSON.parse(readFileSync(out, "utf8"));
  assert.deepEqual(saved.methods, ["getblockchaininfo", "getmempoolinfo", "estimatesmartfee"]);
  assert.equal(saved.host, "10.7.0.2");
  assert.equal(JSON.stringify(saved).includes("no-en-el-repo"), false);
});
