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
    return {
      ok: res.ok,
      status: res.status,
      ms: Date.now() - t0,
      type: res.headers.get("content-type") || "",
      csp: res.headers.get("content-security-policy") || "",
      text,
      bytes: buf.length,
    };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - t0, type: "", csp: "", text: "", bytes: 0, err: err instanceof Error ? err.message : "fail" };
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
  add(core, "sitemap LICENSE", r.status === 200 && r.text.includes("/LICENSE"), r.text.includes("/LICENSE") ? "loc /LICENSE" : "sin LICENSE");
  add(core, "sitemap lastmod fresco", r.status === 200 && /<lastmod>2026-/.test(r.text) && !r.text.includes("<lastmod>2026-09-07</lastmod>"), (r.text.match(/<lastmod>([^<]+)/) || [])[1] || "?");
}

{
  const r = await pull("/LICENSE");
  add(core, "LICENSE AGPL", r.status === 200 && /GNU AFFERO GENERAL PUBLIC LICENSE/.test(r.text), `${r.status} ${r.bytes}b`);
}

{
  const r = await pull("/manifest.webmanifest");
  let name = "";
  try {
    name = JSON.parse(r.text).name || "";
  } catch {
    name = "";
  }
  add(core, "PWA manifest", r.status === 200 && /Bitácora/.test(name) && !r.text.includes("__grok"), `${r.status} name=${name || "?"}`);
}

{
  const home = await pull("/");
  add(core, "PWA link first-party", home.text.includes("/manifest.webmanifest") && !home.text.includes("/__grok/manifest"), home.text.includes("/__grok/manifest") ? "aún /__grok/" : "/manifest.webmanifest");
  add(warn, "tagline Bircoiner", /Bircoiner/.test(home.text), /Bircoiner/.test(home.text) ? "sí" : "sin Bircoiner");
}

{
  const nf = await pull("/no-existe-bitacora");
  add(core, "404 skip", nf.status === 404 && nf.text.includes('href="#contenido"') && nf.text.includes('id="contenido"'), `${nf.status} skip=${nf.text.includes("#contenido")}`);
  add(warn, "404 LICENSE", nf.text.includes("/LICENSE"), nf.text.includes("/LICENSE") ? "link /LICENSE" : "sin /LICENSE");
}

{
  const legal = await pull("/legal");
  add(core, "legal#codigo", /id="codigo"/.test(legal.text) && /AGPL/.test(legal.text), /id="codigo"/.test(legal.text) ? "codigo+AGPL" : "sin #codigo");
}

for (const p of ["/og.jpg", "/favicon.svg", "/contribuir-qr.png", "/contribuir-ln.png", "/humans.txt", "/llms.txt", "/icon-180.png", "/logos/conciencia-bitcoin.png"]) {
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
  const ptH1 = (pt.text.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "";
  const ptH1Plain = ptH1.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  add(
    STRICT ? core : warn,
    "P1-03 copy SSR home",
    /boas-vindas/i.test(ptH1Plain) && !/te damos la bienvenida/i.test(ptH1Plain),
    ptH1Plain.slice(0, 80) || "(sin h1)",
  );
  const legalPt = await pull("/legal?lang=pt");
  add(
    STRICT ? core : warn,
    "P1-03 copy SSR legal",
    /bit[aá]cora comunit[aá]ria|aviso legal · respons[aá]vel/i.test(legalPt.text) && !/es una bitácora comunitaria/i.test(legalPt.text),
    /es una bitácora comunitaria/i.test(legalPt.text) ? "cuerpo aún en es" : "cuerpo pt",
  );
  const grokJs = /grok\.com\/grok-app-builder\/extensions\.js/.test(es.text);
  add(STRICT ? core : warn, "P2-16 sin grok.com/extensions.js", !grokJs, grokJs ? "residual grok.com script" : "limpio");
  const desk = /bit[aá]cora/i.test(es.text) && (es.text.includes("Pulso") || es.text.includes("Mercado") || es.text.includes("mapa"));
  add(core, "desk HTML", desk, "origen renderiza; D-BN/D-MP del runner no es CAÍDA");
  const csp = es.csp || "";
  const img = (csp.match(/img-src[^;]*/i) || [""])[0];
  add(core, "P2-20 img-src allowlist", /img-src/.test(csp) && !/\simg-src[^;]*\shttps:\s/.test(` ${csp}`) && /tiles\.openfreemap\.org/.test(csp) && /tile\.opentopomap\.org/.test(csp) && /lumacdn/.test(csp), img.slice(0, 220) || "sin img-src");
  add(core, "P2-18 CSP sin Google Fonts", !/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(csp), /fonts\.googleapis/.test(csp) ? "fonts google" : "self");
  add(core, "P2-03 sin Esri", !/arcgisonline/.test(csp) && /openfreemap/.test(csp), /arcgisonline/.test(csp) ? "regresión Esri" : "OFM");
  const idx = (es.text.match(/\/assets\/index-[^"' ]+\.js/) || [])[0] || "";
  if (idx) {
    const js = await pull(idx);
    add(core, "P0-11 JS index", js.status === 200 && js.bytes > 1000, `${js.status} ${js.bytes}b`);
  }
  const assets = [...es.text.matchAll(/\/assets\/[^"' ]+\.js/g)].map((m) => m[0]);
  let hasLogo = false;
  let hasLatam = false;
  for (const s of [...new Set(assets)].slice(0, 12)) {
    const js = await pull(s);
    if (js.text.includes("/logo?u=")) hasLogo = true;
    if (/Latinoam|Latin America|América Latina/.test(js.text)) hasLatam = true;
  }
  add(core, "P0-22 bundle /logo", hasLogo, hasLogo ? "imgSrc proxy" : "sin /logo?u= en chunks");
  add(warn, "P1-56 globo Latam copy", hasLatam, hasLatam ? "Latam en bundle" : "N/D-SSR");
}

{
  const luma =
    "https://images.lumacdn.com/cdn-cgi/image/width=960,quality=72,format=jpeg/uploads/az/44234a81-2d45-4379-8ebb-710b3d76e97c.jpg";
  const r = await pull(`/logo?u=${encodeURIComponent(luma)}`, { bin: true });
  add(
    core,
    "P0-25 /logo Luma JPEG",
    r.status === 200 && /image\/(jpeg|jpg|webp|png)/i.test(r.type) && r.bytes > 800 && r.bytes < 400_000,
    `${r.status} ${r.type} ${r.bytes}b`,
  );
  const ssrf = await pull(`/logo?u=${encodeURIComponent("https://127.0.0.1/")}`, { bin: true });
  add(core, "P2-21 /logo SSRF", ssrf.status === 404 || ssrf.status === 400, `${ssrf.status} ${ssrf.bytes}b`);
  const empty = await pull("/logo", { bin: true });
  add(warn, "P2-21 /logo sin u", empty.status === 404, `${empty.status}`);
}

async function third(id, url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": UA } });
    const ms = Date.now() - t0;
    const note = `${res.status} ${ms}ms`;
    if (id === "binance.api" || id === "mempool.space" || id === "formsubmit") {
      add(warn, `3p ${id}`, true, `${note} (D-BN/D-MP/D-FS: runner; no es CAÍDA del origen)`);
      return;
    }
    add(warn, `3p ${id}`, res.ok, note);
  } catch (err) {
    const note = err instanceof Error ? err.message : "fail";
    if (id === "binance.api" || id === "mempool.space" || id === "formsubmit") {
      add(warn, `3p ${id}`, true, `${note} (D-BN/D-MP/D-FS: runner; no es CAÍDA del origen)`);
      return;
    }
    add(warn, `3p ${id}`, false, note);
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
await third("formsubmit", "https://formsubmit.co/");
await third("openfreemap", "https://tiles.openfreemap.org/styles/liberty");
await third("opentopo", "https://a.tile.opentopomap.org/4/5/6.png");

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
