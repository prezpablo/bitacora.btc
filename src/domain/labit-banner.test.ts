import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FEATURED_EVENTS, featuredHref, featuredLinks, featuredText, formatFeaturedWhen, pickFeatured, siteAsset } from "./featured-event.ts";
import type { FeaturedEvent } from "./featured-event.ts";

function contrast(ink: string, accent: string) {
  const lin = (channel: number) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const L = (hex: string) => {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const a = L(ink);
  const b = L(accent);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const credit = { artist: "x", source: "https://example.com/art" };

test("the banner rotates to the next event and hides when that instant passes", () => {
  assert.equal(pickFeatured("2026-10-30T12:00:00Z")?.id, "labitconf-2026");
  assert.equal(pickFeatured("2026-11-02T12:00:00Z")?.id, "bitcoin-historico-2026");
  assert.equal(pickFeatured("2026-11-11T00:00:00Z")?.id, "bitcoin-beach-2026");
  assert.equal(pickFeatured("2026-11-22T23:00:00Z")?.id, "bitcoin-beach-2026");
  assert.equal(pickFeatured("2026-11-23T00:00:00Z")?.id, "la-crypta-cowork-2026-11-24");
  assert.equal(pickFeatured("2026-11-24T14:59:00Z")?.id, "la-crypta-cowork-2026-11-24");
  assert.equal(pickFeatured("2026-11-25T02:59:00Z")?.id, "la-crypta-cowork-2026-11-24");
  assert.equal(pickFeatured("2026-11-25T03:00:00Z"), null);
});

test("an end without an explicit offset is ignored", () => {
  const loose = {
    id: "loose",
    endsAt: "2026-11-24T23:59:59",
    title: { es: "x", en: "x", pt: "x" },
    alt: { es: "x", en: "x", pt: "x" },
    accent: "#000000",
    ink: "#ffffff",
    credit,
    image: { src: "/x.png", width: 1, height: 1 },
  } satisfies FeaturedEvent;
  assert.equal(pickFeatured("2026-11-24T12:00:00Z", [loose]), null);
});

test("La Crypta keeps the event page and tickets, and skips a missing agenda", () => {
  const event = pickFeatured("2026-11-23T15:00:00Z");
  assert.ok(event);
  const links = featuredLinks(event);
  assert.deepEqual(
    links.map((link) => link.kind),
    ["event", "tickets"],
  );
  assert.equal(links[0]?.href, "https://eventos.lacrypta.ar/o/la-crypta/events/cowork-2026-11-24");
  assert.equal(links[1]?.href, "https://eventos.lacrypta.ar/o/la-crypta/events/cowork-2026-11-24#reservar");
  assert.equal(formatFeaturedWhen(event.startsAt || "", "es").includes("11:59"), true);
  assert.match(formatFeaturedWhen(event.startsAt || "", "es"), /24/);
  assert.match(formatFeaturedWhen(event.startsAt || "", "es"), /noviembre/i);
  assert.equal(featuredText(event.where, "en"), "Villanueva 1367, CABA, Argentina");
  assert.equal(formatFeaturedWhen(event.startsAt || "", "es"), "martes 24 de noviembre de 2026, 11:59");
  assert.match(event.alt.es, /Coworking en La Crypta/);
  assert.match(event.alt.es, /24 de noviembre de 2026/);
  assert.match(event.alt.es, /Villanueva 1367/);
  assert.equal(event.credit.artist, "La Crypta");
  assert.equal(event.credit.source, links[0]?.href);
  assert.ok(contrast(event.ink, event.accent) >= 4.5);
});

test("duplicate and non-https links are dropped", () => {
  const event = {
    id: "links",
    endsAt: "2026-12-01T00:00:00Z",
    title: { es: "x", en: "x", pt: "x" },
    alt: { es: "x", en: "x", pt: "x" },
    accent: "#000000",
    ink: "#ffffff",
    credit,
    image: { src: "/x.png", width: 1, height: 1 },
    links: {
      event: "https://example.com/e",
      tickets: "https://example.com/e",
      agenda: "http://example.com/a",
    },
  } satisfies FeaturedEvent;
  assert.deepEqual(featuredLinks(event), [{ kind: "event", href: "https://example.com/e" }]);
  assert.equal(featuredHref("https://example.com/e?utm_source=bitacora"), "");
  assert.equal(featuredHref("https://example.com/e?fbclid=1"), "");
  assert.equal(siteAsset("https://eventos.lacrypta.ar/banner.png"), "");
  assert.equal(siteAsset("//cdn.example/banner.png"), "");
  assert.equal(siteAsset("/eventos/la-crypta-cowork-2026-11-24.avif"), "/eventos/la-crypta-cowork-2026-11-24.avif");
});

test("every featured image stays on this site and button colors clear 4.5:1", () => {
  for (const event of FEATURED_EVENTS) {
    assert.equal(siteAsset(event.image.src), event.image.src);
    if (event.image.avif) assert.equal(siteAsset(event.image.avif), event.image.avif);
    if (event.image.webp) assert.equal(siteAsset(event.image.webp), event.image.webp);
    assert.ok(featuredHref(event.credit.source), event.id);
    assert.ok(contrast(event.ink, event.accent) >= 4.5, event.id);
    for (const link of featuredLinks(event)) assert.equal(link.href.includes("utm_"), false);
  }
});

test("the banner is a link row, not a sponsored seal, and does not hardcode the event", () => {
  const banner = readFileSync(new URL("../components/dashboard/featured-event-banner.tsx", import.meta.url), "utf8");
  const i18n = readFileSync(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.match(banner, /pickFeatured/);
  assert.match(banner, /featuredLinks/);
  assert.match(banner, /siteAsset/);
  assert.match(banner, /loading="lazy"/);
  assert.match(banner, /image\/avif/);
  assert.match(banner, /rel="noopener noreferrer"/);
  assert.match(banner, /aria-describedby/);
  assert.match(banner, /featuredKicker/);
  assert.doesNotMatch(banner, /labitKicker|Patrocinado|Sponsored|patrocinado|alianza|lacrypta\.ar|https?:\/\//);
  assert.match(i18n, /Evento destacado/);
  assert.match(i18n, /Página del evento \{title\}/);
  assert.match(i18n, /Entradas para \{title\}/);
  assert.match(i18n, /Agenda de la comunidad: \{title\}/);
  assert.match(i18n, /Se abre el sitio del evento en otra pestaña/);
  assert.doesNotMatch(i18n, /labitKicker|Destacado · LABITCONF|Featured · LABITCONF|Destaque · LABITCONF|Patrocinado|en alianza/);
});
