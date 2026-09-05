import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

test("no Google Fonts in app source or Caddy", () => {
  const src = [
    "src/styles.css",
    "src/routes/__root.tsx",
    "src/components/seo-head.tsx",
    "deploy/Caddyfile",
  ].map(read).join("\n");
  assert.doesNotMatch(src, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(read("src/styles.css"), /@fontsource\/ubuntu/);
  assert.match(read("deploy/Caddyfile"), /font-src 'self'/);
});

test("legal anchors exist in LEGAL_EU", () => {
  const src = read("src/domain/legal-eu.ts");
  for (const id of ["aviso", "privacidad", "cookies", "accesibilidad", "terminos"]) {
    assert.match(src, new RegExp(`id: "${id}"`));
  }
  assert.match(src, /Ley n\.º 18\.331/);
  assert.doesNotMatch(src, /Pablo Daniel Perez Correa/);
  assert.match(src, /Colonia del Sacramento/);
});

test("footer and banner link the four legal texts", () => {
  const header = read("src/components/site-header.tsx");
  const banner = read("src/components/storage-banner.tsx");
  const labif = read("src/components/labif-dossier.tsx");
  for (const href of ["/legal#aviso", "/legal#privacidad", "/legal#cookies", "/legal#accesibilidad", "/legal#terminos"]) {
    assert.match(header, new RegExp(href.replace("#", "\\#")));
    assert.match(labif, new RegExp(href.replace("#", "\\#")));
  }
  assert.match(banner, /\/legal#cookies/);
  assert.match(banner, /\/legal#privacidad/);
  assert.match(header, /skipToContent/);
  assert.match(header, /id="contenido"/);
});

test("forms gate on privacy checkbox", () => {
  for (const file of [
    "src/components/dashboard/contact.tsx",
    "src/components/dashboard/community-pins.tsx",
    "src/components/map/spend-map.tsx",
    "src/components/map/map-compose-form.tsx",
  ]) {
    const src = read(file);
    assert.match(src, /privacyOk/);
    assert.match(src, /if \(!privacyOk\)|disabled=\{[^}]*!privacyOk/);
  }
  assert.match(read("src/components/map/spend-map.tsx"), /if \(!privacyOk\)/);
  assert.match(read("src/components/map/map-compose-form.tsx"), /PrivacyAccept/);
  assert.match(read("src/components/map/map-compose-form.tsx"), /disabled=\{[^}]*!privacyOk/);
  const accept = read("src/components/privacy-accept.tsx");
  assert.match(accept, /aria-required/);
  assert.match(accept, /\/legal#privacidad/);
  assert.match(accept, /target="_blank"/);
  assert.match(accept, /rel="noopener noreferrer"/);
});

test("Geo-IP on the map waits for extras or a locate gesture", () => {
  const map = read("src/components/map/spend-map.tsx");
  const idx = map.indexOf("if (!extrasAllowed())");
  assert.ok(idx > 0, "spend-map gates auto IP");
  const window = map.slice(idx, idx + 280);
  assert.match(window, /setGeo\("idle"\)/);
  assert.match(window, /locateBest\(false/);
});

test("public CSV snapshots drop CARGA tokens", () => {
  assert.match(read("src/infrastructure/map-csv-io.ts"), /stringifyMapCsvPublic/);
  assert.match(read("src/infrastructure/pins-io.ts"), /stringifyPinsCsvPublic/);
  const pins = read("public/data/pins.csv");
  assert.doesNotMatch(pins, /CARGA-|BIT-[A-Z0-9]{4,}/);
});

test("legal copy lives on /legal, not on the home desk", () => {
  const desk = read("src/components/dashboard/desk.tsx");
  assert.doesNotMatch(desk, /LegalEu/);
  assert.match(read("src/routes/legal.tsx"), /LegalEu/);
  assert.match(read("src/routes/legal.tsx"), /ContactBlock/);
  assert.match(desk, /location\.replace.*\/legal/);
  const header = read("src/components/site-header.tsx");
  assert.match(header, /NAV_LEGAL/);
  assert.match(header, /hash: "privacidad"/);
  assert.match(header, /hash: "contacto"/);
});
