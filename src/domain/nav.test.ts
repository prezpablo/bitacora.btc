import assert from "node:assert/strict";
import { test } from "node:test";
import { COMMUNITY_HUB, FOOTER_COMMUNITY, FOOTER_LEGAL, FOOTER_PROJECT, LEARN_HUB, LEGAL_NAV, MARKET_HUB, PRIMARY_NAV, TELEGRAM_COMMUNITY, UTILITY_NAV, sectorOf, spyOf } from "./nav.ts";

test("D-NAV-01 primary bar is four destinations", () => {
  assert.deepEqual(
    PRIMARY_NAV.map((n) => n.id),
    ["mapa", "aprender", "comunidad", "mercado"],
  );
});

test("D-NAV-02 Aprender hashes to the hub, not a inner block", () => {
  assert.equal(PRIMARY_NAV.find((n) => n.id === "aprender")?.hash, "aprender");
  assert.deepEqual(
    LEARN_HUB.map((n) => n.hash),
    ["conciencia", "historia", "pulso"],
  );
});

test("D-NAV-01 utilities live in the footer, not the bar", () => {
  assert.deepEqual(
    UTILITY_NAV.map((n) => n.id),
    ["hacia", "contacto"],
  );
  assert.ok(!UTILITY_NAV.some((n) => n.id === "privacidad"));
  assert.ok(!PRIMARY_NAV.some((n) => n.id === "hacia" || n.id === "privacidad"));
});

test("legal page keeps privacy and contact", () => {
  assert.deepEqual(
    LEGAL_NAV.map((n) => n.hash),
    ["privacidad", "contacto"],
  );
});

test("D-NAV-03 Red is inside Mercado, not a primary destination", () => {
  assert.deepEqual(
    MARKET_HUB.map((n) => n.hash),
    ["mercado", "red"],
  );
  assert.ok(!PRIMARY_NAV.some((n) => n.id === "red"));
});

test("community hub is anuncios, eventos, feed", () => {
  assert.deepEqual(
    COMMUNITY_HUB.map((n) => n.hash),
    ["anuncios", "eventos", "feed"],
  );
});

test("D-NAV-04 Sumate is not a nav destination", () => {
  assert.ok(!PRIMARY_NAV.some((n) => n.id === "sumate" || n.id === "join"));
  assert.ok(!UTILITY_NAV.some((n) => n.id === "sumate"));
});

test("D-CTA donate is pie #aportes, not Sumate and not the bar", () => {
  assert.ok(!PRIMARY_NAV.some((n) => n.id === "aportes"));
  assert.ok(!UTILITY_NAV.some((n) => n.id === "aportes"));
  assert.equal(sectorOf("aportes"), "pie");
});

test("desk sectors: Mapa+Aprender share llegar; comunidad and mercado are own rooms; pie is footer hashes", () => {
  assert.equal(sectorOf(""), "llegar");
  assert.equal(sectorOf("mapa"), "llegar");
  assert.equal(sectorOf("aprender"), "llegar");
  assert.equal(sectorOf("pulso"), "llegar");
  assert.equal(sectorOf("comunidad"), "comunidad");
  assert.equal(sectorOf("anuncios"), "comunidad");
  assert.equal(sectorOf("eventos"), "comunidad");
  assert.equal(sectorOf("feed"), "comunidad");
  assert.equal(sectorOf("mercado"), "mercado");
  assert.equal(sectorOf("red"), "mercado");
  assert.equal(sectorOf("roadmap"), "pie");
  assert.equal(sectorOf("contacto"), "pie");
  assert.equal(spyOf("historia"), "aprender");
  assert.equal(spyOf("red"), "mercado");
  assert.equal(spyOf("roadmap"), "");
});

test("footer Telegram joins Consciencia Bitcoin", () => {
  assert.equal(TELEGRAM_COMMUNITY, "https://t.me/+hdBuy78MUuZiYjhh");
  assert.ok(!PRIMARY_NAV.some((n) => n.id === "telegram"));
});

test("footer groups project, community and legal", () => {
  assert.deepEqual([...FOOTER_PROJECT], ["mapa", "hacia", "datos", "soberania"]);
  assert.deepEqual([...FOOTER_COMMUNITY], ["contacto", "telegram", "aportes"]);
  assert.deepEqual([...FOOTER_LEGAL], ["aviso", "privacidad", "cookies", "accesibilidad", "terminos"]);
});
