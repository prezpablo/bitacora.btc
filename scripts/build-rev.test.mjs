import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { pickBuildRev, shortRev, stampedRev } from "./build-rev.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("short rev keeps 7 hex digits and rejects the unfilled marker", () => {
  assert.equal(shortRev("03D3C8Fabcdef"), "03d3c8f");
  assert.equal(shortRev("$Format:%H$"), "");
  assert.equal(shortRev(""), "");
});

test("a stamped hash wins over a newer tip and over no git", () => {
  const code = 'export const BUILD_REV = "0123456789abcdef0123456789abcdef01234567";\n';
  assert.equal(stampedRev(code), "0123456789abcdef0123456789abcdef01234567");
  assert.equal(stampedRev('export const BUILD_REV = "$Format:%H$";\n'), "");
  assert.equal(
    pickBuildRev({
      stamped: stampedRev(code),
      env: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      git: "",
    }),
    "01234567".slice(0, 7),
  );
  assert.equal(pickBuildRev({ env: "03d3c8f", git: "bbbbbbb" }), "03d3c8f");
  assert.equal(pickBuildRev({ git: "ccccccc" }), "ccccccc");
});

test("the published file asks GitHub's zip to stamp the commit", () => {
  const attrs = readFileSync(join(root, ".gitattributes"), "utf8");
  const src = readFileSync(join(root, "src/build-rev.ts"), "utf8");
  assert.match(attrs, /^src\/build-rev\.ts export-subst$/m);
  assert.match(src, /\$Format:%H\$/);
});

test("git archive fills the commit the way the GitHub zip does", () => {
  const dir = mkdtempSync(join(tmpdir(), "bitacora-rev-"));
  const git = (args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  git(["init", "-b", "main"]);
  git(["config", "user.email", "rev@bitacora.test"]);
  git(["config", "user.name", "rev"]);
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, ".gitattributes"), "src/build-rev.ts export-subst\n");
  writeFileSync(join(dir, "src/build-rev.ts"), 'export const BUILD_REV = "$Format:%H$";\n');
  git(["add", "."]);
  git(["commit", "-m", "stamp"]);
  const archived = execFileSync("git", ["archive", "--format=tar", "HEAD", "src/build-rev.ts"], { cwd: dir });
  const extracted = execFileSync("tar", ["-xO", "src/build-rev.ts"], { input: archived, encoding: "utf8" });
  const sha = git(["rev-parse", "HEAD"]).trim();
  assert.equal(stampedRev(extracted), sha);
  assert.equal(pickBuildRev({ stamped: stampedRev(extracted) }), sha.slice(0, 7));
});
