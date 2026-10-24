import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { browserHosts, cspHttpsHosts, THIRD_PARTIES } from "./third-parties.ts";
import { CSP_POLICY } from "./csp.ts";

test("every CSP host has a third-party card", () => {
  const csp = cspHttpsHosts(CSP_POLICY).sort();
  const cards = browserHosts();
  assert.deepEqual(cards, csp);
});

test("GitHub and Gmail are not under the list that receives no personal data", () => {
  const named = THIRD_PARTIES.filter((p) => p.name === "GitHub" || p.name === "Google (Gmail)");
  assert.equal(named.length, 2);
  for (const p of named) assert.equal(p.side, "recipient");
  const server = THIRD_PARTIES.filter((p) => p.side === "server").map((p) => p.name);
  assert.ok(!server.some((n) => /GitHub|Gmail/.test(n)));
});

test("the FormSubmit row says the browser also sends the IP", () => {
  const row = THIRD_PARTIES.find((p) => p.name === "FormSubmit");
  assert.ok(row);
  assert.equal(row.side, "browser");
  assert.match(row.why.es, /IP/);
  assert.match(row.why.en, /IP/);
  assert.match(row.why.pt, /IP/);
});

test("undeclared countries are not guessed", () => {
  const src = readFileSync(new URL("./third-parties.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /no declarado|not stated|não declarado/);
  const ofm = THIRD_PARTIES.find((p) => p.name === "OpenFreeMap");
  assert.equal(ofm?.country.es, "Hungría");
  assert.equal(ofm?.countrySource, "https://openfreemap.org/tos/");
  for (const name of ["BTC Map", "GeoJS", "Lingva"]) {
    const row = THIRD_PARTIES.find((p) => p.name === name);
    assert.equal(row?.country.es, "país no informado por el proveedor");
    assert.equal(row?.countrySource, undefined);
  }
  const lingva = THIRD_PARTIES.find((p) => p.name === "Lingva");
  assert.deepEqual(lingva?.hosts, ["lingva.ml"]);
});
