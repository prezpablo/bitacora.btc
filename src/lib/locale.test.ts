import assert from "node:assert/strict";
import { test } from "node:test";
import { langFromQuery } from "./locale.ts";

test("langFromQuery reads ?lang= and objects", () => {
  assert.equal(langFromQuery("?lang=pt"), "pt");
  assert.equal(langFromQuery("lang=en"), "en");
  assert.equal(langFromQuery({ lang: "es" }), "es");
  assert.equal(langFromQuery("?lang=fr"), null);
  assert.equal(langFromQuery(""), null);
});
