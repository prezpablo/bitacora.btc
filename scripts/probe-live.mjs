#!/usr/bin/env node
/**
 * External probes against the live origin. Does not treat runner-blocked
 * third parties (mempool.space, api.binance.com 451) as a site outage.
 *
 *   node scripts/probe-live.mjs
 *   PROBE_ORIGIN=https://bitacorabtc.org PROBE_STRICT=1 node scripts/probe-live.mjs
 */
const ORIGIN = (process.env.PROBE_ORIGIN || "https://bitacorabtc.org").replace(/\/$/, "");
const TIMEOUT = Number(process.env.PROBE_TIMEOUT_MS || 12_000);
const STRICT = process.env.PROBE_STRICT === "1";
const UA = "BitacoraProbe/1 (+https://bitacorabtc.org)";

const core = [];
const warn = [];

async function pull(path, extra = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  const t0 = Date.now();
  try {
    const res = await fetch(`${ORIGIN}${path}`, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": UA, accept: extra.accept || "*/*" },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const text = extra.bin ? "" : buf.toString("utf8");
    return { ok: res.ok, status: res.status, ms: Date.now() - t0, type: res.headers.get("content-type") || "", text, bytes: buf.length };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - t0, type: "", text: "", bytes: 0, err: err instanceof Error ? err.message : "fail" };
  } finally {
    clearTimeout(timer);
  }
}

function htmlLang(html) {
  const m = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
  return m ? m[1].toLowerCase() : "";
}

function htmlTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1] : "";
}

function add(list, id, pass, detail) {
  list.push({ id, pass, detail });
  const mark = pass ? "OK  " : "FAIL";
  console.log(`${mark}  ${id}  ${detail}`);
}

const pages = ["/", "/mapa", "/legal", "/labif"];
for (const p of pages) {
  const r = await pull(p);
  add(core, `page ${p}`, r.status === 200 && /bit[aá]cora/i.test(r.text), `${r.status} ${r.ms}ms ${r.bytes}b`);
}

{
  const r = await pull("/healthz");
  let bodyOk = false;
  try {
    bodyOk = JSON.parse(r.text).ok === true;
  } catch {
    bodyOk = false;
  }
  add(core, "healthz", r.status === 200 && bodyOk, `${r.status} ${r.text.slice(0, 80)}`);
}

{
  const r = await pull("/robots.txt");
  add(
    core,
    "robots",
    r.status === 200 && r.text.includes("Sitemap: https://bitacorabtc.org/sitemap.xml"),
    `${r.status} sitemap=${r.text.includes("bitacorabtc.org/sitemap.xml")}`,
  );
}

{
  const r = await pull("/sitemap.xml");
  const has = ["/?lang=es", "/?lang=pt", "/?lang=en", "/mapa", "/legal"].every((s) => r.text.includes(s));
  add(core, "sitemap hreflang", r.status === 200 && has, `${r.status} ${r.bytes}b`);
}

for (const p of ["/og.jpg", "/favicon.svg", "/contribuir-qr.png", "/contribuir-ln.png", "/humans.txt", "/llms.txt"]) {
  const r = await pull(p, { bin: !p.endsWith(".txt") });
  add(core, `static ${p}`, r.status === 200 && r.bytes > 32, `${r.status} ${r.bytes}b ${r.type}`);
}

const firstParty = [
  "/data/ne-110m-countries.json",
  "/data/ne-cities-10m.json",
  "/data/pins.csv",
  "/data/map.csv",
  "/data/btcmap-shops.json",
  "/data/btcmap-comms.json",
];
for (const p of firstParty) {
  const r = await pull(p, { bin: p.endsWith(".json") });
  add(core, `data ${p}`, r.status === 200 && r.bytes > 16, `${r.status} ${r.bytes}b`);
}

{
  const es = await pull("/");
  const pt = await pull("/?lang=pt");
  const en = await pull("/?lang=en");
  const langs = { es: htmlLang(es.text), pt: htmlLang(pt.text), en: htmlLang(en.text) };
  const titles = { es: htmlTitle(es.text), pt: htmlTitle(pt.text), en: htmlTitle(en.text) };
  const ssrOk = langs.pt.startsWith("pt") && langs.en.startsWith("en") && langs.es.startsWith("es");
  const titleShift = titles.pt !== titles.es || titles.en !== titles.es;
  add(STRICT ? core : warn, "P1-03 html lang SSR", ssrOk, `es=${langs.es || "?"} pt=${langs.pt || "?"} en=${langs.en || "?"}`);
  add(STRICT ? core : warn, "P1-03 title SSR", titleShift, `es="${titles.es.slice(0, 48)}" pt="${titles.pt.slice(0, 48)}"`);
}

async function third(id, url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": UA } });
    const ms = Date.now() - t0;
    const note = `${res.status} ${ms}ms`;
    if (id === "binance.api") {
      add(warn, `3p ${id}`, true, `${note} (451 esperado en varias IPs; no es CAÍDA)`);
      return;
    }
    add(warn, `3p ${id}`, res.ok, note);
  } catch (err) {
    add(warn, `3p ${id}`, false, err instanceof Error ? err.message : "fail");
  } finally {
    clearTimeout(timer);
  }
}

await third("mempool.space", "https://mempool.space/api/v1/fees/recommended");
await third("mempool.ninja", "https://mempool.ninja/api/v1/fees/recommended");
await third("blockstream", "https://blockstream.info/api/blocks/tip/height");
await third("binance.api", "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
await third("binance.vision", "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT");
await third("okx", "https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT-SWAP");

const coreFail = core.filter((x) => !x.pass);
const warnFail = warn.filter((x) => !x.pass);
console.log("");
console.log(`core ${core.filter((x) => x.pass).length}/${core.length}  warn ${warn.filter((x) => x.pass).length}/${warn.length}  origin ${ORIGIN}`);
if (coreFail.length) {
  console.log("SITE FAIL:", coreFail.map((x) => x.id).join(", "));
  process.exit(1);
}
if (warnFail.length) {
  console.log("DEGRADA (no CAÍDA):", warnFail.map((x) => x.id).join(", "));
}
process.exit(0);
