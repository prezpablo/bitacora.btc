import assert from "node:assert/strict";
import test from "node:test";
import { factsFromOsmTags, parseOpeningHours } from "./shop-facts.ts";

test("opening hours Mo-Fr and a split day", () => {
  const week = parseOpeningHours("Mo-Fr 09:00-18:00; Sa 09:00-13:00");
  assert.ok(week);
  assert.equal(week.lun.closed, undefined);
  assert.deepEqual(week.vie, { slots: [{ open: "09:00", close: "18:00" }] });
  assert.deepEqual(week.sab, { slots: [{ open: "09:00", close: "13:00" }] });
  assert.equal(week.dom.closed, true);
});

test("opening hours that we cannot read stay as text", () => {
  assert.equal(parseOpeningHours("Mo-Fr 09:00-12:00,13:00-18:00,20:00-22:00"), null);
  assert.equal(parseOpeningHours("Mo-Fr sunrise-sunset"), null);
});

test("osm tags become address, web and lightning", () => {
  const facts = factsFromOsmTags({
    "addr:street": "Calle 57",
    "addr:housenumber": "1535",
    "addr:city": "La Plata",
    opening_hours: "Tu-Th 19:30-23:00; Fr-Sa 19:30-23:30",
    website: "https://bouriksburgers.restosimple.com/",
    phone: "+542213649345",
    "payment:lightning": "yes",
  });
  assert.equal(facts.address, "Calle 57 1535, La Plata");
  assert.equal(facts.phone, "+542213649345");
  assert.equal(facts.links?.[0]?.url, "https://bouriksburgers.restosimple.com/");
  assert.deepEqual(facts.pays, ["lightning"]);
  assert.equal(facts.hours?.mar.closed, undefined);
  assert.equal(facts.hours?.lun.closed, true);
});
