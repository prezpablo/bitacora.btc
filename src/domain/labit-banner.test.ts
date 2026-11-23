import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { pickFeatured } from "./featured-event.ts";

test("from 11 nov the banner is El Zonte, split, through the 22nd", () => {
  const beach = pickFeatured("2026-11-11");
  assert.equal(beach?.id, "bitcoin-beach-2026");
  assert.equal(beach?.split, true);
  assert.equal(beach?.accent, "#FE6A00");
  assert.match(beach?.site || "", /bitcoinbeach\.com/);
  assert.equal(pickFeatured("2026-11-02")?.id, "bitcoin-historico-2026");
  assert.equal(pickFeatured("2026-10-30")?.id, "labitconf-2026");
  assert.equal(pickFeatured("2026-11-22")?.id, "bitcoin-beach-2026");
  assert.equal(pickFeatured("2026-11-23")?.id, "lacrypta-cowork-2026-11-24");
});

test("Coworking en La Crypta stays up through 24 nov and hides the next day", () => {
  const event = pickFeatured("2026-11-24");
  assert.equal(event?.id, "lacrypta-cowork-2026-11-24");
  assert.equal(event?.name, "Coworking en La Crypta");
  assert.equal(event?.place, "Villanueva 1367, CABA");
  assert.equal(event?.when, "2026-11-24T11:59:00-03:00");
  assert.equal(event?.poster, true);
  assert.equal(event?.image, "/eventos/la-crypta-coworking-2026-11-24.png");
  assert.match(event?.alt || "", /Villanueva 1367/);
  assert.match(event?.alt || "", /2\.100 sats/);
  assert.equal(event?.site, "https://eventos.lacrypta.ar/o/la-crypta/events/cowork-2026-11-24");
  assert.equal(
    event?.tickets,
    "https://eventos.lacrypta.ar/o/la-crypta/events/cowork-2026-11-24#reservar",
  );
  assert.equal(event?.agenda, undefined);
  assert.equal(pickFeatured("2026-11-25"), null);
});

test("the banner is a link, not a sponsored or featured seal", () => {
  const banner = readFileSync(
    new URL("../components/dashboard/labitconf-banner.tsx", import.meta.url),
    "utf8",
  );
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.match(banner, /pickFeatured/);
  assert.match(banner, /bitcoinbeach\.com/);
  assert.match(banner, /grid-cols-\[1fr_auto_1fr\]/);
  assert.match(banner, /event\.poster/);
  assert.match(banner, /noopener noreferrer/);
  assert.match(banner, /eventPage/);
  assert.match(banner, /eventTickets/);
  assert.match(banner, /eventAgenda/);
  assert.doesNotMatch(banner, /labitKicker|Patrocinado|Sponsored|Destacado/);
  assert.doesNotMatch(
    i18n,
    /labitKicker|Destacado · LABITCONF|Featured · LABITCONF|Destaque · LABITCONF/,
  );
});
