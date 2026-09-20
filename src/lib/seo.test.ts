import assert from "node:assert/strict";
import { test } from "node:test";
import { hreflangHref, jsonLd, MAPA_COPY, pageCanonical, pagePath, pageSeo, robotsFor } from "./seo.ts";

test("pageSeo is per path and language", () => {
  assert.match(pageSeo("/", "es").title, /Latinoamérica/);
  assert.match(pageSeo("/", "pt").title, /América Latina/);
  assert.match(pageSeo("/mapa", "es").title, /comercios y comunidades Bitcoin/);
  assert.equal(pageSeo("/legal", "en").title, "Legal notice, privacy and cookies | Bitácora.btc");
  assert.match(pageSeo("/labif", "pt").title, /LABIF/);
});

test("D-LABIF robots is noindex", () => {
  assert.equal(robotsFor("/labif"), "noindex,follow");
  assert.match(robotsFor("/"), /^index,follow/);
  assert.match(robotsFor("/mapa"), /^index,follow/);
});

test("canonical is self and hreflang is per path", () => {
  const origin = "https://bitacorabtc.org";
  assert.equal(pagePath("/mapa/"), "/mapa");
  assert.equal(pageCanonical(origin, "/mapa", "pt", false), "https://bitacorabtc.org/mapa");
  assert.equal(pageCanonical(origin, "/mapa", "pt", true), "https://bitacorabtc.org/mapa?lang=pt");
  assert.equal(hreflangHref(origin, "/legal", "en"), "https://bitacorabtc.org/legal?lang=en");
  assert.equal(hreflangHref(origin, "/legal", "x-default"), "https://bitacorabtc.org/legal");
});

test("jsonLd WebPage follows the route; FAQ on home and mapa", () => {
  const origin = "https://bitacorabtc.org";
  const home = jsonLd("es", origin, "/", "https://bitacorabtc.org/");
  const types = home["@graph"].map((n: { "@type": string }) => n["@type"]);
  assert.deepEqual(types.includes("FAQPage"), true);
  const page = home["@graph"].find((n: { "@type": string }) => n["@type"] === "WebPage") as { url: string; name: string };
  assert.equal(page.url, "https://bitacorabtc.org/");
  assert.match(page.name, /Latinoamérica/);

  const mapa = jsonLd("pt", origin, "/mapa", "https://bitacorabtc.org/mapa?lang=pt");
  const mapaTypes = mapa["@graph"].map((n: { "@type": string }) => n["@type"]);
  assert.equal(mapaTypes.includes("FAQPage"), true);
  assert.equal(mapaTypes.includes("Map"), true);
  assert.equal(mapaTypes.includes("BreadcrumbList"), true);
  const mapaPage = mapa["@graph"].find((n: { "@type": string }) => n["@type"] === "WebPage") as { url: string; name: string };
  assert.equal(mapaPage.url, "https://bitacorabtc.org/mapa?lang=pt");
  assert.match(mapaPage.name, /América Latina/);
});

test("MAPA_COPY has three languages", () => {
  assert.match(MAPA_COPY.es.lead, /Latinoamérica/);
  assert.match(MAPA_COPY.en.how, /CARGA/);
  assert.match(MAPA_COPY.pt.where, /América Latina/);
});
