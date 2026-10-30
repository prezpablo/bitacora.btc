import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("comercio, comunidad y anuncio devuelven CARGA sin gastar el captcha al rechazar", () => {
  const run = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--import", "./scripts/register-ts-alias.mjs", "src/infrastructure/carga-flow-check.ts"],
    { encoding: "utf8", timeout: 120_000 },
  );
  assert.equal(run.status, 0, `${run.stdout || ""}\n${run.stderr || ""}`);
  assert.match(run.stdout || "", /SHOP CARGA-/);
  assert.match(run.stdout || "", /COMM CARGA-/);
  assert.match(run.stdout || "", /PIN CARGA-/);
});

test("el mapa enseña el código y el pin nuevo no lo tapa una comunidad", () => {
  const map = readFileSync(new URL("../components/map/spend-map.tsx", import.meta.url), "utf8");
  const portal = map.indexOf("createPortal");
  const token = map.indexOf("pendingCarga?.token");
  const drop = map.indexOf('drop && dropKind === "pick"');
  const comm = map.indexOf(") : selComm ?");
  assert.ok(portal > 0 && token > portal);
  assert.ok(drop > 0 && comm > drop);
  const accept = readFileSync(new URL("./carga-accept.ts", import.meta.url), "utf8");
  const shopAt = accept.indexOf('atLimit(clientKey("map-add")');
  const shopCap = accept.indexOf("consumeCaptchaTicket", shopAt);
  assert.ok(shopAt > 0 && shopCap > shopAt);
  const pinAt = accept.indexOf('atLimit(clientKey("pin")');
  const pinCap = accept.lastIndexOf("consumeCaptchaTicket");
  assert.ok(pinAt > 0 && pinCap > pinAt);
});
