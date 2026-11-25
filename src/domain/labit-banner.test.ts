import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FEATURED_EVENTS, featuredHref, featuredLinks, featuredLinkSplit, featuredText, foreignLang, formatFeaturedCompact, formatFeaturedWhen, pickFeatured, siteAsset } from "./featured-event.ts";
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

const credit = { kind: "organizer" as const, artist: "x", source: "https://example.com/art" };

test("the banner rotates to the next event and hides when that instant passes", () => {
  assert.equal(pickFeatured("2026-10-30T12:00:00Z")?.id, "labitconf-2026");
  assert.equal(pickFeatured("2026-11-02T12:00:00Z")?.id, "bitcoin-historico-2026");
  assert.equal(pickFeatured("2026-11-11T00:00:00Z")?.id, "bitcoin-beach-2026");
  assert.equal(pickFeatured("2026-11-21T23:00:00Z")?.id, "bitcoin-beach-2026");
  assert.equal(pickFeatured("2026-11-22T00:00:00Z")?.id, "sovereign-2026");
  assert.equal(pickFeatured("2026-11-23T15:00:00-03:00")?.id, "sovereign-2026");
  const sov = pickFeatured("2026-11-23T12:00:00Z");
  assert.equal(sov?.id, "sovereign-2026");
  assert.match(sov?.links?.tickets || "", /satlantis\.io\/embed\/events\/1002890\/tickets/);
  assert.match(sov?.links?.agenda || "", /sovereign-conference\.com\/es\/#program/);
  assert.equal(pickFeatured("2026-11-24T15:00:00-03:00")?.id, "la-crypta-cowork-2026-11-24");
  assert.equal(pickFeatured("2026-11-24T14:59:00Z")?.id, "la-crypta-cowork-2026-11-24");
  assert.equal(pickFeatured("2026-11-25T02:59:00Z")?.id, "la-crypta-cowork-2026-11-24");
  assert.equal(pickFeatured("2026-11-25T03:00:00Z")?.id, "bitdevs-bh-2026-11-25");
  assert.equal(pickFeatured("2026-11-25T20:59:00-03:00")?.id, "bitdevs-bh-2026-11-25");
  assert.equal(pickFeatured("2026-11-25T21:00:00-03:00")?.id, "bitdevs-sp-2026-11-26");
  assert.equal(pickFeatured("2026-11-26T15:00:00-03:00")?.id, "bitdevs-sp-2026-11-26");
  assert.equal(pickFeatured("2026-11-26T23:59:00-03:00")?.id, "bitdevs-sp-2026-11-26");
  assert.equal(pickFeatured("2026-11-27T00:00:00-03:00")?.id, "bitdevs-ba-2026-11-28");
  assert.equal(pickFeatured("2026-11-28T16:00:00-03:00")?.id, "bitdevs-ba-2026-11-28");
  assert.equal(pickFeatured("2026-11-28T18:29:00-03:00")?.id, "bitdevs-ba-2026-11-28");
  assert.equal(pickFeatured("2026-11-28T18:30:00-03:00"), null);
});

test("the next three BitDevs meetups chain without a gap and keep one clean link each", () => {
  const bh = pickFeatured("2026-11-25T19:30:00-03:00");
  const sp = pickFeatured("2026-11-26T12:00:00-03:00");
  const between = pickFeatured("2026-11-27T12:00:00-03:00");
  const ba = pickFeatured("2026-11-28T16:00:00-03:00");
  assert.equal(bh?.id, "bitdevs-bh-2026-11-25");
  assert.equal(sp?.id, "bitdevs-sp-2026-11-26");
  assert.equal(between?.id, "bitdevs-ba-2026-11-28");
  assert.equal(ba?.id, "bitdevs-ba-2026-11-28");
  assert.ok(bh && sp && ba);
  if (!bh || !sp || !ba) return;
  assert.deepEqual(featuredLinks(bh).map((link) => link.kind), ["event"]);
  assert.equal(featuredLinks(bh)[0]?.href, "https://www.meetup.com/pt-br/belo-horizonte-bitdevs/events/317255330/");
  assert.deepEqual(featuredLinks(sp).map((link) => link.kind), ["event"]);
  assert.equal(featuredLinks(sp)[0]?.href, "https://saopaulobitdevs.org/2026-11-26-socratic-seminar-050");
  assert.equal(sp.startsAt, undefined);
  assert.deepEqual(featuredLinks(ba).map((link) => link.kind), ["event", "tickets"]);
  assert.equal(featuredLinks(ba)[1]?.href, "https://app.evento.so/e/evt_nHFKpYNeAxpVQq1f");
  for (const event of [bh, sp, ba]) {
    assert.equal(event.credit.kind, "bitacora");
    assert.equal(event.image.width, 1200);
    assert.equal(event.image.height, 630);
    assert.ok(event.image.avif && event.image.webp);
    for (const link of featuredLinks(event)) {
      assert.equal(link.href.endsWith("#"), false);
      assert.equal(link.href.includes("utm_"), false);
    }
  }
  assert.equal(formatFeaturedCompact(bh.startsAt || "", "pt"), "Qua 25 nov · 19:00");
  assert.equal(formatFeaturedCompact(ba.startsAt || "", "es"), "Sáb 28 nov · 15:45");
  assert.equal(featuredText(bh.place, "es"), "Belo Horizonte");
  assert.equal(featuredText(sp.where, "pt"), "Vinteum, São Paulo, Brasil");
  assert.equal(featuredText(ba.where, "es"), "Cafe.te, Thames 937, Buenos Aires, Argentina");
});

test("an end without an explicit offset is ignored", () => {
  const loose = {
    id: "loose",
    endsAt: "2026-11-24T23:59:59",
    lang: "es",
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
  const event = pickFeatured("2026-11-24T15:00:00Z");
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
  assert.equal(formatFeaturedCompact(event.startsAt || "", "es"), "Mar 24 nov · 11:59");
  assert.equal(formatFeaturedCompact(event.startsAt || "", "en"), "Tue 24 Nov · 11:59");
  assert.equal(formatFeaturedCompact(event.startsAt || "", "pt"), "Ter 24 nov · 11:59");
  assert.equal(featuredText(event.place, "es"), "CABA");
  assert.deepEqual(featuredLinkSplit("Página del evento {title}", "Página del evento"), { lead: " ", tail: "" });
  assert.deepEqual(featuredLinkSplit("Entradas para {title}", "Entradas"), { lead: " para ", tail: "" });
  assert.equal(featuredLinkSplit("Otra cosa {title}", "Entradas"), null);
  assert.match(event.alt.es, /Coworking en La Crypta/);
  assert.match(event.alt.es, /24 de noviembre de 2026/);
  assert.match(event.alt.es, /Villanueva 1367/);
  assert.equal(event.lang, "es");
  assert.equal(event.credit.kind, "bitacora");
  if (event.credit.kind !== "bitacora") return;
  assert.equal(event.credit.identity, "La Crypta");
  assert.equal(event.credit.source, links[0]?.href);
  const esCredit = `Diseño: Bitácora BTC, con la identidad visual de ${event.credit.identity}.`;
  const enCredit = `Design: Bitácora BTC, using the visual identity of ${event.credit.identity}.`;
  const ptCredit = `Design: Bitácora BTC, com a identidade visual de ${event.credit.identity}.`;
  assert.equal(esCredit, "Diseño: Bitácora BTC, con la identidad visual de La Crypta.");
  assert.equal(enCredit, "Design: Bitácora BTC, using the visual identity of La Crypta.");
  assert.equal(ptCredit, "Design: Bitácora BTC, com a identidade visual de La Crypta.");
  assert.doesNotMatch(`${esCredit}\n${enCredit}\n${ptCredit}`, /Arte: La Crypta/);
  assert.equal(foreignLang(event.lang, "en"), "es");
  assert.equal(foreignLang(event.lang, "pt"), "es");
  assert.equal(foreignLang(event.lang, "es"), undefined);
  assert.ok(contrast(event.ink, event.accent) >= 4.5);
});

test("duplicate and non-https links are dropped", () => {
  const event = {
    id: "links",
    endsAt: "2026-12-01T00:00:00Z",
    lang: "es",
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
  assert.match(banner, /foreignLang/);
  assert.match(banner, /featuredCreditDesign/);
  assert.match(banner, /lang=\{titleLang\}/);
  assert.match(banner, /sr-only/);
  assert.match(banner, /featuredPageShort/);
  assert.match(banner, /featuredSourceLink/);
  assert.match(banner, /formatFeaturedCompact/);
  assert.match(banner, /bg-primary/);
  assert.match(banner, /text-muted-foreground/);
  assert.match(banner, /border-2/);
  assert.match(banner, /border-foreground/);
  assert.ok(contrast("#1d1d1b", "#ffffff") >= 3);
  assert.doesNotMatch(banner, /event\.note|event\.where|featuredSource[^L]/);
  assert.ok(contrast("#ffffff", "#9a5600") >= 4.5);
  assert.ok(contrast("#5c6370", "#ffffff") >= 4.5);
  assert.doesNotMatch(banner, /labitKicker|Patrocinado|Sponsored|patrocinado|alianza|lacrypta\.ar|https?:\/\/|youtube|Ver en vivo/);
  const special = readFileSync(new URL("../components/dashboard/labitconf-banner.tsx", import.meta.url), "utf8");
  const data = readFileSync(new URL("../content/featured-events.ts", import.meta.url), "utf8");
  assert.doesNotMatch(special + data + i18n, /youtube|cryptaCta|Ver en vivo|Watch live|Ver ao vivo/);
  assert.match(data, /sovereign-2026/);
  assert.match(special, /SovereignBanner/);
  assert.match(special, /BeachSplit/);
  assert.match(i18n, /Diseño: Bitácora BTC, con la identidad visual de \{identity\}/);
  assert.match(i18n, /Design: Bitácora BTC, using the visual identity of \{identity\}/);
  assert.match(i18n, /Design: Bitácora BTC, com a identidade visual de \{identity\}/);
  assert.match(i18n, /Evento destacado/);
  assert.match(i18n, /Página del evento \{title\}/);
  assert.match(i18n, /Entradas para \{title\}/);
  assert.match(i18n, /Agenda de la comunidad: \{title\}/);
  assert.match(i18n, /Se abre el sitio del evento en otra pestaña/);
  assert.doesNotMatch(i18n, /labitKicker|Destacado · LABITCONF|Featured · LABITCONF|Destaque · LABITCONF|Patrocinado|en alianza/);
});
