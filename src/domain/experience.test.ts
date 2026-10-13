import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { cleanExperience, experienceOnBoard, experiencePublic } from "./experience.ts";

test("an experience needs activity, city, a date or recurrent, and sats or a deal", () => {
  assert.equal("error" in cleanExperience({ activity: "a", city: "Montevideo", when: "2026-11-01", price: "1000" }) && cleanExperience({ activity: "a", city: "Montevideo", when: "2026-11-01", price: "1000" }).error, "need");
  const ok = cleanExperience({ activity: "Taller de llaves", city: "Colonia", when: "2026-11-02", price: "21000" });
  assert.equal("activity" in ok && ok.price, "21000");
  const again = cleanExperience({ activity: "Círculo semanal", city: "CABA", recurrent: true, deal: true });
  assert.equal("when" in again && again.when, "recurrente");
  assert.equal("price" in again && again.price, "convenio");
  const badDay = cleanExperience({ activity: "Mate", city: "Salto", when: "mañana", price: "1" });
  assert.equal("error" in badDay && badDay.error, "when");
});

test("the public card hides the code and waits for a proof link", () => {
  const row = {
    id: "xp:1",
    activity: "Taller",
    city: "Colonia",
    when: "recurrente",
    price: "convenio",
    proof: "https://nodo.uy/taller",
    token: "CARGA-ABC123",
    verified: true,
    verifiedAt: 1,
    created: 1,
  };
  assert.equal(experiencePublic(row).token, "");
  assert.equal(experienceOnBoard(row), true);
  assert.equal(experienceOnBoard({ ...row, verified: false }), false);
});

test("experiences are not a sitemap page", () => {
  const xml = readFileSync(new URL("../../public/sitemap.xml", import.meta.url), "utf8");
  assert.doesNotMatch(xml, /experiencia/i);
});
