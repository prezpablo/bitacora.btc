import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LEGAL, legalFilled } from "./legal-config.ts";
import { LEGAL_EU, legalBody, urcdpParagraph } from "./legal-eu.ts";

test("legal config uses the stated controller and does not invent the rest", () => {
  assert.equal(LEGAL.controllerName, "Pablo Daniel Perez Correa");
  assert.equal(LEGAL.city, "Colonia del Sacramento, Colonia, Uruguay");
  assert.equal(LEGAL.address, "[DOMICILIO_NOTIFICACIONES]");
  assert.equal(legalFilled(LEGAL.address), false);
  assert.equal(legalFilled(LEGAL.vpsCountry), true);
  assert.equal(LEGAL.contributionLicense, "CC BY 4.0");
  assert.equal(legalFilled(LEGAL.translator), false);
  assert.equal(legalFilled(LEGAL.privacyEmail), true);
  assert.equal(LEGAL.consentVersion, "2.15");
  const terms = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.equal(terms.match(/CC BY 4\.0/g)?.length, 6);
  assert.match(terms, /ODbL/);
  assert.match(terms, /AGPL-3\.0/);
  assert.equal(LEGAL.expediente, "[N.º TRÁMITE]");
  assert.equal(legalFilled(LEGAL.expediente), false);
  assert.equal(LEGAL.filingDate, "[FECHA_PRESENTACION]");
  assert.equal(legalFilled(LEGAL.inscription), false);
  assert.doesNotMatch(terms, /Número de trámite: en trámite/);
  assert.doesNotMatch(terms, /Procedure number: in progress/);
  assert.doesNotMatch(terms, /Número do processo: em tramitação/);
  assert.doesNotMatch(terms, /2 de setiembre de 2026|2 September 2026|2 de setembro de 2026/);
  assert.doesNotMatch(terms, /no se publica aquí hasta que esté cargado|not published here until it is filled/);
  assert.match(terms, /10\. Experiencias/);
  assert.match(terms, /10\. Experiences/);
  assert.match(terms, /10\. Experiências/);
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
  const xp = readFileSync(new URL("../components/dashboard/experiences.tsx", import.meta.url), "utf8");
  assert.match(xp, /keep="xp"/);
  const infos = [...src.matchAll(/consentXpInfo:\n\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(infos.length, 3);
  for (const row of infos) {
    assert.doesNotMatch(row, /GitHub|FormSubmit/);
    assert.match(row, /\{keep\}/);
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

test("without a notice address the page does not say it is already published", () => {
  for (const lang of ["es", "en", "pt"] as const) {
    const aviso = LEGAL_EU[lang].blocks.find((b) => b.id === "aviso")?.body || "";
    const rights = LEGAL_EU[lang].blocks.find((b) => b.id === "derechos")?.body || "";
    const shown = legalBody(`${aviso}\n${rights}`, lang);
    assert.doesNotMatch(shown, /domicilio de notificación figuran|notice address are on this page|endereço para notificações estão nesta página/);
    assert.match(shown, /se agregará cuando esté constituido|will be added once it is set up|será acrescentado quando estiver constituído/);
  }
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.equal([...i18n.matchAll(/legalWhoPending:/g)].length, 3);
});

test("URCDP filing has three states and does not invent a procedure number", () => {
  for (const lang of ["es", "en", "pt"] as const) {
    const rights = LEGAL_EU[lang].blocks.find((b) => b.id === "derechos")?.body || "";
    const shown = legalBody(rights, lang);
    assert.doesNotMatch(shown, /Número de trámite: en trámite|Procedure number: in progress|Número do processo: em tramitação/);
    assert.doesNotMatch(shown, /\{\{URCDP\}\}/);
    assert.doesNotMatch(shown, /anuncios|experiencias|announcements|experiences|anúncios|experiências/i);
    assert.match(shown, /todavía no asignó|has not yet assigned|ainda não atribuiu/);
    assert.match(shown, /contacto y de seguridad|contact and security|contato e de segurança/);
  }
  const numbered = urcdpParagraph("es", { date: "[FECHA_PRESENTACION]", file: "2026-1", reg: "[N.º INSCRIPCIÓN]" });
  assert.match(numbered, /Número de trámite: 2026-1/);
  assert.doesNotMatch(numbered, /todavía no asignó|Número de inscripción/);
  const dated = urcdpParagraph("es", { date: "2 de setiembre de 2026", file: "[N.º TRÁMITE]", reg: "[N.º INSCRIPCIÓN]" });
  assert.match(dated, /se presentó el 2 de setiembre de 2026/);
  assert.match(dated, /todavía no asignó/);
});

test("the transfer citation names article 23 subsection 2 letter A and invents no retention period", () => {
  const terms = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.match(terms, /Ley 18\.331, art\. 23, inciso 2º, literal A/);
  assert.match(terms, /Act 18\.331, art\. 23, subsection 2, letter A/);
  assert.match(terms, /Lei 18\.331, art\. 23, inciso 2º, alínea A/);
  assert.doesNotMatch(terms, /art\. 23 A/);
  assert.doesNotMatch(terms, /\[PLAZO_LOGS\]|\[PLAZO_FORMSUBMIT\]/);
  assert.match(terms, /Hasta 12 meses/);
});

test("rights go to the privacy mailbox, not the contact form, and market cites no Act 17.250", () => {
  const src = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /17\.250/);
  assert.doesNotMatch(src, /ejercer derechos es el formulario|go through this site’s Contact form|formulário de Contacto deste/);
  assert.doesNotMatch(src, /nombre civil se da|civil name is given|nome civil é dado/);
  assert.match(src, /privacidad@bitacorabtc\.org/);
});

test("contact transfer consent names FormSubmit and is not every third party", () => {
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  const labels = [...i18n.matchAll(/consentTransfer: "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(labels.length, 3);
  for (const label of labels) assert.match(label, /FormSubmit/);
  const legal = readFileSync(new URL("./legal-eu.ts", import.meta.url), "utf8");
  assert.doesNotMatch(legal, /casilla de privacidad documenta tu consentimiento a estas transferencias/);
  assert.doesNotMatch(legal, /privacy checkbox records your consent to these transfers/);
  assert.doesNotMatch(legal, /caixa de privacidade documenta o seu consentimento a estas transferências/);
  assert.match(legal, /casilla de Contacto que nombra a FormSubmit/);
  const form = readFileSync(new URL("../components/dashboard/contact.tsx", import.meta.url), "utf8");
  const server = readFileSync(new URL("../infrastructure/server-fns.ts", import.meta.url), "utf8");
  assert.match(form, /privacy-transfer/);
  assert.match(form, /transfer: true/);
  assert.match(server, /data\.transfer !== true/);
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
