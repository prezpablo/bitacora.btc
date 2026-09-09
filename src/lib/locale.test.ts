import assert from "node:assert/strict";
import { test } from "node:test";
import { langFromLocation, langFromQuery, langIsExplicit, pickLang, retainLangSearch } from "./locale.ts";

test("langFromQuery reads ?lang= and objects", () => {
  assert.equal(langFromQuery("?lang=pt"), "pt");
  assert.equal(langFromQuery("lang=en"), "en");
  assert.equal(langFromQuery({ lang: "es" }), "es");
  assert.equal(langFromQuery({ lang: ["pt"] }), "pt");
  assert.equal(langFromQuery(new URLSearchParams("lang=en")), "en");
  assert.equal(langFromQuery("https://bitacorabtc.org/?lang=pt"), "pt");
  assert.equal(langFromQuery("?lang=fr"), null);
  assert.equal(langFromQuery(""), null);
  assert.equal(langFromLocation({ searchStr: "?lang=en" }), "en");
  assert.equal(langFromLocation({ search: { lang: "pt" } }), "pt");
  assert.equal(langFromLocation({ url: "https://bitacorabtc.org/?lang=en" }), "en");
  assert.equal(langFromLocation({}), "es");
});

test("pickLang and retainLangSearch keep ?lang= for SSR", () => {
  assert.equal(pickLang("", {}, "?lang=pt"), "pt");
  assert.equal(pickLang("https://bitacorabtc.org/?lang=en"), "en");
  assert.equal(pickLang(null, undefined, ""), "es");
  assert.equal(langIsExplicit("?lang=pt"), true);
  assert.equal(langIsExplicit(""), false);
  assert.deepEqual(retainLangSearch({ lang: "pt", extra: 1 }), { lang: "pt" });
  assert.deepEqual(retainLangSearch({}), {});
});
