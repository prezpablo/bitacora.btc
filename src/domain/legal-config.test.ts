import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LEGAL, legalFilled } from "./legal-config.ts";

test("legal config uses the stated controller and does not invent the rest", () => {
  assert.equal(LEGAL.controllerName, "Pablo Daniel Perez Correa");
  assert.equal(LEGAL.address, "Colonia del Sacramento, Colonia, Uruguay");
  assert.equal(legalFilled(LEGAL.vpsCountry), true);
  assert.equal(LEGAL.contributionLicense, "CC BY 4.0");
  assert.equal(legalFilled(LEGAL.translator), false);
  assert.equal(legalFilled(LEGAL.privacyEmail), true);
  assert.equal(LEGAL.consentVersion, "2.3");
  const terms = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.equal(terms.match(/CC BY 4\.0/g)?.length, 3);
  assert.match(terms, /ODbL/);
  assert.match(terms, /AGPL-3\.0/);
  assert.equal(LEGAL.expediente, "en trámite");
  assert.equal(legalFilled(LEGAL.inscription), false);
  assert.match(terms, /Número de trámite: en trámite/);
  assert.match(terms, /Procedure number: in progress/);
  assert.match(terms, /Número de trâmite: em tramitação/);
});

test("publish consent is not the contact form", () => {
  const src = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  const blocks = [...src.matchAll(/consentPublishInfo:\n\s*"([^"]+)"/g)].map((m) => m[1]);
  const contacts = [...src.matchAll(/consentContactInfo:\n\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(blocks.length, 3);
  assert.equal(contacts.length, 3);
  for (const pub of blocks) {
    assert.doesNotMatch(pub, /FormSubmit|12 meses|12 months|\{license\}|\[/);
    assert.match(pub, /GitHub/);
  }
  for (const row of contacts) {
    assert.match(row, /FormSubmit/);
    assert.doesNotMatch(row, /\{name\}|\{address\}|\[NOMBRE|\[DOMICILIO/);
  }
  const lead = [...src.matchAll(/thirdLead: "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(lead.length, 3);
  for (const row of lead) assert.doesNotMatch(row, /\{vps\}|\{translator\}|\[/);
});

test("an unfilled legal field is not printed", () => {
  assert.equal(legalFilled("[PAÍS_VPS]"), false);
  assert.equal(legalFilled("[PROVEEDOR_TRADUCCION]"), false);
  assert.equal(legalFilled("[LICENCIA_CONTRIBUCIONES]"), false);
  assert.equal(legalFilled("privacidad@bitacorabtc.org"), true);
});

test("rights go to the privacy mailbox, not the contact form, and market cites no Act 17.250", () => {
  const src = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /17\.250/);
  assert.doesNotMatch(src, /ejercer derechos es el formulario|go through this site’s Contact form|formulário de Contacto deste/);
  assert.doesNotMatch(src, /nombre civil se da|civil name is given|nome civil é dado/);
  assert.match(src, /privacidad@bitacorabtc\.org/);
});

test("contact acknowledgement is sent only when asked", () => {
  const server = readFileSync(new URL("../infrastructure/server-fns.ts", import.meta.url), "utf8");
  const form = readFileSync(new URL("../components/dashboard/contact.tsx", import.meta.url), "utf8");
  assert.match(server, /data\.ack === true/);
  assert.doesNotMatch(server, /forwardFormSubmit\(payload\), forwardAck\(payload\)/);
  assert.match(form, /contactWantAck/);
  assert.match(form, /ack: wantAck/);
  assert.match(form, /useState\(false\)/);
});
