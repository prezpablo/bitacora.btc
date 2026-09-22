import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("D-NAV bar order is Mapa, Aprender, Comunidad, Mercado", () => {
  const nav = read("src/domain/nav.ts");
  const ids = [...nav.matchAll(/PRIMARY_NAV[\s\S]*?id: "([^"]+)"/g)].map((m) => m[1]);
  const primary = nav.slice(nav.indexOf("PRIMARY_NAV"), nav.indexOf("UTILITY_NAV"));
  assert.deepEqual(
    [...primary.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]),
    ["mapa", "aprender", "comunidad", "mercado"],
  );
  assert.equal(ids[0], "mapa");
});

test("D-NAV-02 Aprender hub wraps conciencia, historia and pulso", () => {
  const desk = read("src/components/dashboard/desk.tsx");
  const aprender = desk.indexOf('id="aprender"');
  const conciencia = desk.indexOf('id="conciencia"');
  const pulso = desk.indexOf('id="pulso"');
  const comunidad = desk.indexOf('id="comunidad"');
  const roadmap = desk.indexOf("<RoadmapWeb3");
  assert.ok(aprender > 0 && conciencia > aprender && pulso > conciencia && pulso < comunidad);
  assert.ok(roadmap > comunidad, "roadmap must not sit between Aprender and Comunidad");
  assert.match(desk, /LearnIndex/);
  assert.match(desk, /COMMUNITY_HUB/);
  assert.match(desk, /id="anuncios"/);
  assert.match(desk, /id="eventos"/);
  assert.match(desk, /id="feed"/);
  assert.match(desk, /SiteShell fill/);
  assert.match(desk, /sectorOf/);
});

test("D-NAV-03 Red is nested inside Mercado", () => {
  const desk = read("src/components/dashboard/desk.tsx");
  const mercado = desk.indexOf('id="mercado"');
  const red = desk.indexOf('id="red"');
  const datos = desk.indexOf('id="datos"');
  assert.ok(mercado > 0 && red > mercado && red < datos);
});

test("D-NAV-04 header Sumate is a CTA, not a fifth destination", () => {
  const head = read("src/components/site-header.tsx");
  assert.match(head, /TELEGRAM_COMMUNITY/);
  assert.match(head, /navSumateShort/);
  assert.match(head, /whitespace-nowrap/);
  assert.match(head, /data-destinos/);
  assert.doesNotMatch(head, /requestJoinMap/);
  assert.doesNotMatch(read("src/domain/nav.ts"), /id: "sumate"/);
});

test("home and contact point crawlers at /mapa", () => {
  assert.match(read("src/components/dashboard/conciencia.tsx"), /href="\/mapa"/);
  assert.match(read("src/components/dashboard/contact.tsx"), /href="\/mapa"/);
  assert.match(read("src/components/site-header.tsx"), /href="\/mapa"/);
  assert.match(read("server/middleware/grok-pwa.ts"), /bitacorabtc\.org/);
});

test("footer does not list Privacidad twice", () => {
  const head = read("src/components/site-header.tsx");
  assert.equal((head.match(/legalPrivacy/g) || []).length, 1);
  assert.match(head, /footerProject/);
  assert.match(head, /footerCommunity/);
  assert.match(head, /sm:grid-cols-3|grid-cols-3/);
  assert.match(head, /footerJoinShort/);
  assert.match(head, /footerHaciaShort/);
  assert.match(read("src/components/contribute-qr.tsx"), /compact \? "size-6"/);
  assert.match(head, /min-h-6/);
  assert.match(head, /size-5/);
  assert.doesNotMatch(read("src/domain/nav.ts").slice(
    read("src/domain/nav.ts").indexOf("UTILITY_NAV"),
    read("src/domain/nav.ts").indexOf("LEGAL_NAV"),
  ), /privacidad/);
});

test("carga shop does not require an address to enable Pedir código", () => {
  const form = read("src/components/map/map-compose-form.tsx");
  assert.match(form, /shopReady = Boolean\(shopName.trim\(\)\) && captchaOk && privacyOk/);
  assert.doesNotMatch(form, /pinMatchesAddress/);
  assert.match(read("src/components/map/address-search.tsx"), /addrOptional/);
  assert.doesNotMatch(read("src/components/map/address-search.tsx"), /aria-required="true"/);
});

test("wheel zoom waits for focus on map, globe and chart", () => {
  assert.match(read("src/components/map/spend-map.tsx"), /scrollWheelZoom: false/);
  assert.match(read("src/components/map/world-globe.tsx"), /enableZoom = true/);
  assert.match(read("src/components/map/world-globe.tsx"), /enableZoom = false/);
  const chart = read("src/components/dashboard/price-chart.tsx");
  assert.match(chart, /document.activeElement !== node/);
  assert.match(read("src/components/dashboard/desk.tsx"), /chartDisclaimer/);
});

test("globe keyboard rotates zooms and enters", () => {
  const globe = read("src/components/map/world-globe.tsx");
  assert.match(globe, /ArrowLeft/);
  assert.match(globe, /Escape/);
  assert.match(globe, /globeKeys/);
  assert.match(globe, /role="application"/);
  assert.match(globe, /el.tabIndex = -1/);
  const copy = read("src/lib/i18n.ts");
  assert.match(copy, /Flechas giran/);
  assert.match(copy, /Arrows spin/);
  assert.match(copy, /Setas giram/);
});

test("globe keeps overlay community logos when far", () => {
  const globe = read("src/components/map/world-globe.tsx");
  assert.match(globe, /FOUNDING_UY\.id/);
  assert.match(globe, /own.has\(p.id\)/);
});

test("street-zoom shop pins can carry logo", () => {
  const ent = read("src/domain/entities.ts");
  assert.match(ent, /logo\?: string/);
  const fetch = read("src/infrastructure/btc-map.ts");
  assert.match(fetch, /zoom >= 13/);
  assert.match(fetch, /catalogShopsInBox/);
});

test("D-VIZ-01 candles share bit-stage and recharts is gone", () => {
  assert.match(read("src/components/dashboard/price-chart.tsx"), /bit-stage/);
  assert.match(read("src/components/dashboard/desk.tsx"), /bit-stage bg-plot/);
  assert.doesNotMatch(read("package.json"), /"recharts"/);
});

test("globe is the hero stage with overlay stats", () => {
  const globe = read("src/components/map/world-globe.tsx");
  assert.match(globe, /bit-globe/);
  assert.match(globe, /globeCitiesShort/);
  assert.match(globe, /grid-cols-2/);
  assert.match(globe, /rgba\(29,29,27,0\.12\)/);
  assert.doesNotMatch(globe, /absolute inset-x-0 top-0/);
  assert.match(globe, /altitude: 2\.05/);
  assert.match(read("src/components/map/spend-map.tsx"), /bit-globe/);
  assert.doesNotMatch(read("src/components/map/world-globe.tsx"), /flex min-h-0 flex-1 flex-col/);
});

test("responsive queries use Tailwind rem cuts and short viewport", () => {
  const css = read("src/styles.css");
  assert.match(css, /@media \(width >= 40rem\)/);
  assert.match(css, /@media \(width >= 64rem\)/);
  assert.match(css, /@media \(max-height: 32rem\)/);
  assert.match(css, /\.bit-spark/);
  assert.match(css, /min-height: 220px/);
  assert.match(css, /flex-shrink: 0/);
  assert.match(css, /height: 280px/);
  assert.match(css, /\.bit-globe/);
  assert.match(css, /calc\(100dvh - 14\.5rem\)/);
  assert.match(css, /\.chip-row/);
  assert.match(css, /\.chip \{/);
  assert.match(read("src/components/site-header.tsx"), /site-head/);
  assert.match(read("src/components/dashboard/etf-flow.tsx"), /bit-spark/);
});

test("D-VIZ-02 ETF and heatmap follow parent width", () => {
  const etf = read("src/components/dashboard/etf-flow.tsx");
  assert.match(etf, /useParentSize/);
  assert.match(etf, /width="100%"/);
  assert.doesNotMatch(etf, /const w = 720/);
  const heat = read("src/components/dashboard/liq-heatmap.tsx");
  assert.match(heat, /useParentSize/);
  assert.doesNotMatch(heat, /viewBox="0 0 920 400"/);
  assert.doesNotMatch(heat, /preserveAspectRatio="none"/);
});

test("D-VIZ-03 ticks hit-24 and EMA menu", () => {
  const chart = read("src/components/dashboard/price-chart.tsx");
  assert.match(chart, /slim \? 3/);
  assert.match(chart, /Math\.max\(layout\.bodyW, 24\)/);
  assert.match(chart, /pointer: coarse/);
  assert.match(read("src/components/dashboard/segmented.tsx"), /<details/);
});

test("i18n nav labels exist in es en pt", () => {
  const copy = read("src/lib/i18n.ts");
  for (const label of ["Historia de Bitcoin", "Bitcoin history", "História do Bitcoin", "Bitcoin hoy", "Bitcoin today", "Bitcoin hoje"]) {
    assert.match(copy, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("footer links Telegram Consciencia Bitcoin once", () => {
  const head = read("src/components/site-header.tsx");
  assert.match(head, /TELEGRAM_COMMUNITY/);
  assert.match(head, /joinTelegram/);
  assert.match(read("src/domain/nav.ts"), /t\.me\/\+hdBuy78MUuZiYjhh/);
  const copy = read("src/lib/i18n.ts");
  assert.match(copy, /Unite a Consciencia Bitcoin/);
  assert.match(copy, /Join Consciencia Bitcoin/);
  assert.match(copy, /Junta-te à Consciencia Bitcoin/);
});

test("Comunidad features LABITCONF 26 banner above anuncios", () => {
  const desk = read("src/components/dashboard/desk.tsx");
  const banner = desk.indexOf("<LabitconfBanner");
  const ads = desk.indexOf('id="anuncios"');
  assert.ok(banner > 0 && ads > banner, "banner must sit above anuncios");
  const src = read("src/components/dashboard/labitconf-banner.tsx");
  assert.match(src, /https:\/\/www\.labitconf\.com\//);
  assert.match(src, /labitconf-hodl\.jpg/);
  assert.match(src, /#ABF760/);
  const copy = read("src/lib/i18n.ts");
  assert.match(copy, /Comprar ticket/);
  assert.match(copy, /Get tickets/);
  assert.match(copy, /Comprar ingresso/);
});

test("D-BANNER storage compacts after first visit", () => {
  const banner = read("src/components/storage-banner.tsx");
  assert.match(banner, /bitacora-storage-seen/);
  assert.match(banner, /data-compact/);
  assert.match(banner, /--storage-pad/);
  assert.match(read("src/components/site-header.tsx"), /--storage-pad/);
});

test("D-LABIF robots noindex", () => {
  assert.match(read("src/lib/seo.ts"), /noindex,follow/);
  assert.match(read("src/routes/__root.tsx"), /robotsFor/);
  assert.match(read("src/components/seo-head.tsx"), /robotsFor/);
  assert.match(read("deploy/Caddyfile"), /path \/LICENSE \/humans.txt \/labif/);
  assert.match(read("server/middleware/robots-tag.ts"), /X-Robots-Tag/);
});

test("price chart keyboard pans and zooms when focused", () => {
  const chart = read("src/components/dashboard/price-chart.tsx");
  assert.match(chart, /onKeyDown/);
  assert.match(chart, /ArrowLeft/);
  assert.match(chart, /chartKeys/);
  const copy = read("src/lib/i18n.ts");
  assert.match(copy, /Flechas recorren/);
  assert.match(copy, /Arrows pan/);
  assert.match(copy, /Setas percorrem/);
});

test("event chips orange only when selected; load overlay holds height", () => {
  const ev = read("src/components/dashboard/network-events.tsx");
  assert.match(ev, /!platform \|\| platform === name/);
  assert.match(ev, /kind === k.key \? chipOn : chipIdle/);
  assert.match(ev, /bit-spin/);
  assert.match(ev, /min-h-\[28rem\]/);
  assert.match(ev, /pinDeskScroll/);
  assert.doesNotMatch(ev, /history\.replaceState/);
  assert.match(read("src/styles.css"), /\.chip-idle/);
  assert.match(read("src/components/dashboard/hub-index.tsx"), /chip-on/);
  assert.match(read("src/components/dashboard/desk.tsx"), /lastScroll/);
});
