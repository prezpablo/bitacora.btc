import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { speakChallenge, speechLang, spokenCode } from "./captcha-speech.ts";

test("spokenCode spells letters with pauses", () => {
  assert.equal(spokenCode("k4m2p"), "K. 4. M. 2. P");
  assert.equal(spokenCode(""), "");
});

test("speechLang follows the three site locales", () => {
  assert.equal(speechLang("es"), "es-UY");
  assert.equal(speechLang("en"), "en-US");
  assert.equal(speechLang("pt"), "pt-BR");
});

test("speakChallenge uses SpeechSynthesis when present", () => {
  const spoken: SpeechSynthesisUtterance[] = [];
  const synth = {
    cancel() {},
    speak(u: SpeechSynthesisUtterance) {
      spoken.push(u);
    },
  } as unknown as SpeechSynthesis;
  assert.equal(speakChallenge("", "es", synth), false);
  assert.equal(speakChallenge("AB3", "es", synth), true);
  assert.equal(spoken[0]?.text, "A. B. 3");
  assert.equal(spoken[0]?.lang, "es-UY");
  assert.equal(speakChallenge("AB3", "en", synth), true);
  assert.equal(spoken[1]?.lang, "en-US");
});

test("speakChallenge is a no-op without an engine", () => {
  assert.equal(speakChallenge("AB3", "es", null), false);
});

test("the captcha keeps audio and adds a mailto", () => {
  const ui = readFileSync(new URL("../components/map/captcha.tsx", import.meta.url), "utf8");
  const i18n = readFileSync(new URL("./i18n.ts", import.meta.url), "utf8");
  assert.match(ui, /speakChallenge/);
  assert.match(ui, /mailto:\$\{LEGAL\.a11yEmail\}/);
  assert.match(i18n, /captchaMail: "Si no podés, escribí a accesibilidad@bitacorabtc.org"/);
  assert.match(i18n, /captchaMail: "If you cannot, email accesibilidad@bitacorabtc.org"/);
  assert.match(i18n, /captchaMail: "Se não der, escreva para accesibilidad@bitacorabtc.org"/);
});
