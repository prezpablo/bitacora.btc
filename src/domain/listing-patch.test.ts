import assert from "node:assert/strict";
import { test } from "node:test";
import type { MapCsvRow } from "./map-csv.ts";
import {
  PATCH_MAX_MOVE_M,
  applyPatchToRow,
  listingIsOurs,
  makeContactTicket,
  metersBetween,
  proposePatch,
} from "./listing-patch.ts";

function row(over: Partial<MapCsvRow> = {}): MapCsvRow {
  return {
    id: "local:-34.47100,-57.84400",
    tipo: "shop",
    name: "Café Satoshi",
    lat: -34.471,
    lon: -57.844,
    address: "Calle de San Carlos 12",
    description: "Pagos en sats",
    notes: "",
    score: 0,
    votes: 0,
    logo: "",
    socials: "web:https://example.com",
    hours: "",
    pays: "onchain",
    created: 1,
    token: "CARGA-OLD",
    verifiedAt: 2,
    ...over,
  };
}

test("only overlay listings accept patches", () => {
  assert.equal(listingIsOurs("local:1,2"), true);
  assert.equal(listingIsOurs("c:consciencia-bitcoin"), true);
  assert.equal(listingIsOurs("btcmap:99"), false);
});

test("proposePatch allows empty proof (code first) and rejects junk URLs", () => {
  const same = proposePatch(row(), { description: "Pagos en sats" }, "https://x.com/nodo/status/1");
  assert.equal("error" in same && same.error, "nochange");
  const noUrl = proposePatch(row(), { description: "Nuevo horario" }, "not-a-url");
  assert.equal("error" in noUrl && noUrl.error, "links");
  const pending = proposePatch(row(), { description: "Ahora cierra 18h" }, "");
  assert.equal("patch" in pending, true);
  if ("patch" in pending) {
    assert.equal(pending.patch.proof, "");
    assert.match(pending.patch.token, /^CARGA-[A-Z0-9]{6}$/);
    assert.equal(pending.patch.verified, false);
  }
  const ok = proposePatch(row(), { description: "Ahora cierra 18h" }, "https://nodo.uy/bitacora");
  assert.equal("patch" in ok, true);
  if ("patch" in ok) {
    assert.match(ok.patch.token, /^CARGA-[A-Z0-9]{6}$/);
    assert.equal(ok.patch.verified, false);
  }
});

test("applyPatchToRow keeps id and refreshes verifiedAt", () => {
  const made = proposePatch(row(), { name: "Café Satoshi Colonia", address: "18 de Julio 100" }, "https://nodo.uy");
  assert.equal("patch" in made, true);
  if (!("patch" in made)) return;
  const next = applyPatchToRow(row(), made.patch, 99);
  assert.equal(next.id, row().id);
  assert.equal(next.name, "Café Satoshi Colonia");
  assert.equal(next.address, "18 de Julio 100");
  assert.equal(next.verifiedAt, 99);
  assert.equal(next.token, "CARGA-OLD");
});

test("80 m is the move ceiling", () => {
  const a = { lat: -34.471, lon: -57.844 };
  assert.ok(metersBetween(a, { lat: -34.4712, lon: -57.844 }) < PATCH_MAX_MOVE_M);
  assert.ok(metersBetween(a, { lat: -34.48, lon: -57.844 }) > PATCH_MAX_MOVE_M);
});

test("contact ticket is TKT- plus 6 chars", () => {
  assert.match(makeContactTicket(), /^TKT-[A-Z0-9]{6}$/);
});
