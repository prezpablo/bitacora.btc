import assert from "node:assert/strict";
import { test } from "node:test";
import { locateOnConsent } from "./locate-user.ts";
import type { GeoFix } from "../domain/geo-frame.ts";
import type { GpsSession } from "../domain/geo-fix.ts";

const ip: GeoFix = { lat: -34.9, lon: -56.16, accuracy: 12_000, source: "ip" };

test("permission denied skips the GPS watch and uses IP", async () => {
  const session: GpsSession = {
    first: Promise.reject({ code: 1, message: "User denied Geolocation" }),
    best: new Promise(() => {}),
    note: () => {},
  };
  const t0 = Date.now();
  const out = await locateOnConsent(session, { ip: async () => ip });
  assert.ok(Date.now() - t0 < 800);
  assert.equal(out.gpsFail, "denied");
  assert.equal(out.fix?.source, "ip");
});

test("coarse GPS returns at once and does not call IP", async () => {
  let calls = 0;
  const coarse: GeoFix = { lat: -34.47, lon: -57.84, accuracy: 400, source: "gps" };
  const session: GpsSession = {
    first: Promise.resolve(coarse),
    best: new Promise(() => {}),
    note: () => {},
  };
  const out = await locateOnConsent(session, {
    ip: async () => {
      calls += 1;
      return ip;
    },
  });
  assert.equal(calls, 0);
  assert.equal(out.gpsFail, null);
  assert.equal(out.fix?.source, "gps");
  assert.equal(out.fix?.accuracy, 400);
});

test("precise GPS returns without IP", async () => {
  const gps: GeoFix = { lat: -34.47, lon: -57.84, accuracy: 20, source: "gps" };
  const session: GpsSession = {
    first: Promise.resolve(gps),
    best: Promise.resolve(gps),
    note: () => {},
  };
  const out = await locateOnConsent(session, { ip: async () => ip });
  assert.equal(out.gpsFail, null);
  assert.equal(out.fix?.source, "gps");
  assert.equal(out.fix?.accuracy, 20);
});
