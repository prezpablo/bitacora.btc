import assert from "node:assert/strict";
import test from "node:test";
import { decodeEntities, jpegSize, parseHead, sitemapLocs } from "./probe-seo.mjs";

test("decodeEntities undoes named entities once", () => {
  const amp = "&" + "amp;";
  const quot = "&" + "quot;";
  const lt = "&" + "lt;";
  assert.equal(decodeEntities(`${quot}Bitácora${amp}btc${quot}`), `"Bitácora&btc"`);
  assert.equal(decodeEntities(`${lt}title>`), "<title>");
});

test("parseHead reads lang title canonical hreflang and json-ld", () => {
  const html = `<html lang="pt"><head>
    <title>Mapa Bitcoin Latam | Bitácora.btc</title>
    <link rel="canonical" href="https://bitacorabtc.org/mapa?lang=pt"/>
    <link rel="alternate" href="https://bitacorabtc.org/mapa?lang=pt" hreflang="pt"/>
    <meta property="og:url" content="https://bitacorabtc.org/mapa?lang=pt"/>
    <script type="application/ld+json">{"@graph":[{"@type":"WebPage","url":"https://bitacorabtc.org/mapa?lang=pt"}]}</script>
  </head></html>`;
  const h = parseHead(html);
  assert.equal(h.lang, "pt");
  assert.equal(h.title, "Mapa Bitcoin Latam | Bitácora.btc");
  assert.equal(h.canonical, "https://bitacorabtc.org/mapa?lang=pt");
  assert.equal(h.hreflang.pt, "https://bitacorabtc.org/mapa?lang=pt");
  assert.equal(h.webPage.url, "https://bitacorabtc.org/mapa?lang=pt");
  assert.equal(h.grokJs, false);
});

test("sitemapLocs ignores hreflang hrefs", () => {
  const xml = `<urlset><url><loc>https://bitacorabtc.org/mapa</loc>
    <xhtml:link href="https://bitacorabtc.org/mapa?lang=pt"/></url></urlset>`;
  assert.deepEqual(sitemapLocs(xml), ["https://bitacorabtc.org/mapa"]);
});

test("jpegSize reads SOF dimensions", () => {
  const buf = Buffer.from([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x02, 0x76, 0x04, 0xb0, 0x03, 0x01, 0x22, 0x00,
  ]);
  assert.deepEqual(jpegSize(buf), { width: 1200, height: 630 });
});
