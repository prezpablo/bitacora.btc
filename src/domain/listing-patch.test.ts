import assert from "node:assert/strict";
import { test } from "node:test";
import type { MapCsvRow } from "./map-csv.ts";
import {
  applyPatchToRow,
  listingIsOurs,
  makeContactTicket,
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

test("a BTC Map pin is saved as a Bitácora overlay, not rejected", () => {
  const foreign = proposePatch(row({ id: "node:13424595224", name: "Roderich" }), { name: "Roderich Casa" }, "");
  assert.equal("patch" in foreign, true);
  if (!("patch" in foreign)) return;
  assert.equal(foreign.patch.listingId, "node:13424595224");
  assert.equal(foreign.patch.verified, false);
  const next = applyPatchToRow(row({ id: "node:13424595224", name: "Roderich" }), foreign.patch, 7);
  assert.equal(next.id, "node:13424595224");
  assert.equal(next.name, "Roderich Casa");
});

test("a pin may move up to 80 m and no further", () => {
  const near = proposePatch(row(), { description: "Pagos en sats" }, "", { lat: -34.4712, lon: -57.844 });
  assert.equal("patch" in near, true);
  if ("patch" in near) {
    assert.equal(near.patch.verified, false);
    const next = applyPatchToRow(row(), near.patch, 40);
    assert.equal(next.lat, -34.4712);
    assert.equal(next.verifiedAt, 40);
  }
  const far = proposePatch(row(), { name: "Café Satoshi" }, "", { lat: -34.48, lon: -57.844 });
  assert.equal("error" in far && far.error, "move");
});

test("a patch can rewrite hours, pays and socials, or clear notes", () => {
  const made = proposePatch(
    row(),
    { hours: "lun09001700", pays: "lightning", socials: "x:https://x.com/cafe", notes: "" },
    "",
  );
  assert.equal("patch" in made, true);
  if (!("patch" in made)) return;
  const next = applyPatchToRow(row(), made.patch, 50);
  assert.equal(next.hours, "lun09001700");
  assert.equal(next.pays, "lightning");
  assert.equal(next.socials, "x:https://x.com/cafe");
  assert.equal(next.notes, "");
  assert.equal(next.description, "Pagos en sats");
});

test("contact ticket is TKT- plus 6 chars", () => {
  assert.match(makeContactTicket(), /^TKT-[A-Z0-9]{6}$/);
});
