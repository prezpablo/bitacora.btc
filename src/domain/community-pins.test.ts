import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PIN_TTL_MS,
  formatPinLeft,
  makePinToken,
  mergePins,
  parsePinsCsv,
  pinAlive,
  pinMsLeft,
  pinOnBoard,
  pinPending,
  pinTimeLeft,
  stringifyPinsCsv,
  stringifyPinsCsvPublic,
  type CommunityPin,
} from "./community-pins.ts";

function pin(over: Partial<CommunityPin> = {}): CommunityPin {
  return {
    id: "pin:test",
    name: "Nodo",
    blurb: "hola",
    proof: "https://x.com/nodo",
    links: ["https://njump.me/npub1abc"],
    token: "CARGA-ABC234",
    verified: false,
    verifiedAt: 0,
    created: Date.now(),
    ...over,
  };
}

test("makePinToken is CARGA- plus 6 chars", () => {
  const t = makePinToken();
  assert.match(t, /^CARGA-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
});

test("pending pin is not public; verified is", () => {
  const now = 1_000_000;
  assert.equal(pinPending(pin({ created: now - 1000 }), now), true);
  assert.equal(pinAlive(pin({ created: now - 1000 }), now), false);
  assert.equal(pinOnBoard(pin({ created: now - PIN_TTL_MS - 1 }), now), false);
  assert.equal(pinAlive(pin({ verified: true, verifiedAt: now - 1000, created: now - 2000 }), now), true);
});

test("CSV round-trip keeps token and links", () => {
  const rows = [pin({ links: ["https://x.com/a", "https://njump.me/npub1x"] })];
  const again = parsePinsCsv(stringifyPinsCsv(rows));
  assert.equal(again.length, 1);
  assert.equal(again[0]!.token, "CARGA-ABC234");
  assert.deepEqual(again[0]!.links, ["https://x.com/a", "https://njump.me/npub1x"]);
});

test("public CSV strips CARGA token", () => {
  const rows = [pin()];
  const pub = parsePinsCsv(stringifyPinsCsvPublic(rows));
  assert.equal(pub[0]!.token, "");
  assert.equal(pub[0]!.name, "Nodo");
});

test("mergePins does not un-verify", () => {
  const live = pin({ verified: true, verifiedAt: 9 });
  const incoming = pin({ verified: false, verifiedAt: 0, blurb: "nuevo" });
  const out = mergePins([live], [incoming]);
  assert.equal(out[0]!.verified, true);
  assert.equal(out[0]!.verifiedAt, 9);
  assert.equal(out[0]!.blurb, "nuevo");
});

test("parsePinsCsv drops rows without http proof", () => {
  const csv = "id,name,blurb,proof,links,token,verified,verifiedAt,created\npin:x,N,b,javascript:alert(1),,CARGA-AAAAAA,0,0,1\n";
  assert.equal(parsePinsCsv(csv).length, 0);
});

test("pinTimeLeft counts real remainder until TTL", () => {
  const now = 1_800_000_000_000;
  const live = pin({ verified: true, verifiedAt: now - (PIN_TTL_MS - 90 * 60_000), created: now - PIN_TTL_MS });
  const left = pinTimeLeft(live, now);
  assert.equal(left.h, 1);
  assert.equal(left.m, 30);
  assert.equal(formatPinLeft(left), "1h 30m");
  const pendingRow = pin({ verified: false, created: now - (PIN_TTL_MS - 2 * 86_400_000 - 3 * 3_600_000) });
  assert.equal(formatPinLeft(pinTimeLeft(pendingRow, now)), "2d 03h");
  assert.equal(pinMsLeft(pin({ verified: true, verifiedAt: now - PIN_TTL_MS }), now), 0);
});
