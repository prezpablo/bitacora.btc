import assert from "node:assert/strict";
import { test } from "node:test";
import { addressIssues } from "./street-addr.ts";

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
