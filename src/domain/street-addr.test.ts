import assert from "node:assert/strict";
import { test } from "node:test";
import { addressIssues, expandStreetQuery, pinMatchesAddress, searchStreetQuery, streetMatchesQuery, streetKey } from "./street-addr.ts";

test("empty pick is not a street", () => {
  assert.deepEqual(addressIssues(null), ["pick"]);
});

test("complete hit has no issues", () => {
  assert.deepEqual(
    addressIssues({
      id: "1",
      label: "18 de Julio 123",
      hint: "Montevideo",
      lat: -34.9,
      lon: -56.16,
      street: "18 de Julio",
      number: "123",
      city: "Montevideo",
      countryCode: "UY",
    }),
    [],
  );
});

test("map tap does not need a house number", () => {
  assert.deepEqual(
    addressIssues({
      id: "map:1",
      label: "18 de Julio",
      hint: "Montevideo",
      lat: -34.9,
      lon: -56.16,
      street: "18 de Julio",
      city: "Montevideo",
      countryCode: "UY",
      fromMap: true,
    }),
    [],
  );
});

test("typed address still needs a house number", () => {
  assert.deepEqual(
    addressIssues({
      id: "1",
      label: "18 de Julio",
      hint: "Montevideo",
      lat: -34.9,
      lon: -56.16,
      street: "18 de Julio",
      city: "Montevideo",
      countryCode: "UY",
    }),
    ["number"],
  );
});

test("pin matches the written address only if they sit on the same door", () => {
  const pin = { lat: -34.9, lon: -56.16 };
  assert.equal(pinMatchesAddress(pin, { ...pin }), true);
  assert.equal(pinMatchesAddress(pin, { lat: -34.9002, lon: -56.16 }), true);
  assert.equal(pinMatchesAddress(pin, { lat: -34.9, lon: -56.162 }), false);
  assert.equal(pinMatchesAddress(pin, null), false);
  assert.equal(pinMatchesAddress(null, pin), false);
});

test("gral flores expands to general flores", () => {
  assert.equal(expandStreetQuery("gral flores"), "general flores");
  assert.equal(expandStreetQuery("Av. 18 de Julio"), "avenida 18 de Julio");
  assert.equal(streetKey("Gral. Flores"), streetKey("General Flores"));
  assert.equal(streetKey("Av. Italia"), streetKey("avenida italia"));
});

test("full pasted address is reduced to the street for search", () => {
  assert.equal(
    searchStreetQuery("Domingo baqué 200, colonia del sacramento,colonia, uruguay"),
    "Domingo baqué 200",
  );
  assert.equal(searchStreetQuery("gral flores, paysandu"), "general flores");
  assert.equal(
    streetMatchesQuery({ label: "Domingo Baque", street: "Domingo Baque" }, "Domingo baqué 200, colonia del sacramento"),
    true,
  );
});
