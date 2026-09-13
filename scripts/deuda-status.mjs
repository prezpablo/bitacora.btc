#!/usr/bin/env node
/**
 * Seguimiento de deuda: cola machine-readable + sondas repo/live.
 * No falla el CI por ítems ABIERTOS. Falla si un GUARD cerrado se rompe.
 *
 *   node scripts/deuda-status.mjs
 *   node scripts/deuda-status.mjs --live
 *   DEUDA_LIVE=1 node scripts/deuda-status.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COLA = join(ROOT, "docs/deuda-cola.json");
const LIVE = process.argv.includes("--live") || process.env.DEUDA_LIVE === "1";
const ORIGIN = (process.env.PROBE_ORIGIN || "https://bitacorabtc.org").replace(/\/$/, "");
const UA = "BitacoraDeuda/1 (+https://bitacorabtc.org)";

export function loadCola(raw) {
  const doc = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!Array.isArray(doc.items) || !Array.isArray(doc.guards)) throw new Error("cola shape");
  return doc;
}

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

async function pull(url, ms = 10_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": UA } });
    const text = await res.text();
    return { status: res.status, text, csp: res.headers.get("content-security-policy") || "" };
  } catch (err) {
    return { status: 0, text: err instanceof Error ? err.message : "fail", csp: "" };
  } finally {
    clearTimeout(t);
  }
}

function repoCheck(id) {
  if (id === "D-PIN-01") {
    const src = read("src/components/map/spend-map.tsx");
    const stale = /west:\s*-56\.35/.test(src);
    return { pass: !stale, detail: stale ? "bbox MVD hardcode" : "bbox no es MVD fijo" };
  }
  if (id === "D-PIN-02") {
    const cat = read("src/infrastructure/catalog.ts");
    const btc = read("src/infrastructure/btc-map.ts");
    const cap = /LIMIT 800/.test(cat) || /\.slice\(0,\s*800\)/.test(btc);
    const superC = existsSync(join(ROOT, "node_modules/supercluster")) || /supercluster/.test(read("package.json"));
    return { pass: !cap && superC, detail: cap ? "LIMIT/slice 800" : superC ? "sin cap 800" : "sin supercluster" };
  }
  if (id === "D-PIN-03") {
    const fn = read("src/infrastructure/server-fns.ts") + read("src/infrastructure/btc-map.ts");
    const slim = /lat,lon,icon|id, lat, lon/.test(fn) && !/slice\(0,\s*800\)/.test(read("src/infrastructure/btc-map.ts"));
    return { pass: slim, detail: slim ? "payload flaco" : "MerchantPlace completo / cap 800" };
  }
  if (id === "D-STATS") {
    const i18n = read("src/lib/i18n.ts");
    const split = /globeLatam|latamShops|BTC Map mundial|btcmapWorld/i.test(i18n);
    return { pass: split, detail: split ? "copy Latam/mundial" : "sin copy partido" };
  }
  if (id === "D-CTA") {
    const header = read("src/components/site-header.tsx");
    const donateInHeader = /ContributeQr|contribuir-qr|bitcoin:bc1q/i.test(header);
    return { pass: !donateInHeader, detail: donateInHeader ? "QR donar en header" : "header sin QR donar" };
  }
  if (id === "D-TILE-03") {
    const map = read("src/components/map/spend-map.tsx");
    const esri = /arcgisonline|World_Street_Map/.test(map);
    const off = /openfreemap|pmtiles/i.test(map);
    return { pass: !esri && off, detail: esri ? "sigue Esri" : off ? "OpenFreeMap/PMTiles" : "sin tesela soberana" };
  }
  if (id === "D-QA") {
    const pkg = read("package.json");
    const has = /"quality":/.test(pkg) && /"lint:core":/.test(pkg);
    return { pass: false, detail: has ? "quality existe; tsc global aún falla (D-QA abierto)" : "falta npm run quality" };
  }
  if (id === "D-PWA") {
    const root = read("src/routes/__root.tsx");
    const grok = /\/__grok\//.test(root);
    return { pass: !grok, detail: grok ? "manifest /__grok/" : "PWA propio" };
  }
  if (id === "D-VIZ-01") {
    const chart = read("src/components/dashboard/price-chart.tsx");
    const pkg = read("package.json");
    const stage = /bit-stage/.test(chart);
    const dead = /"recharts"/.test(pkg);
    return { pass: stage && !dead, detail: !stage ? "velas sin bit-stage" : dead ? "recharts sigue" : "bit-stage + sin recharts" };
  }
  if (id === "D-VIZ-02") {
    const etf = read("src/components/dashboard/etf-flow.tsx");
    const heat = read("src/components/dashboard/liq-heatmap.tsx");
    const ok = /viewBox/.test(etf) && /clientWidth|100%/.test(etf) && !/viewBox="0 0 920 400"/.test(heat);
    return { pass: ok, detail: ok ? "ETF/calor al ancho" : "SVG fijo 720/920" };
  }
  if (id === "D-VIZ-03") {
    const chart = read("src/components/dashboard/price-chart.tsx");
    const seg = read("src/components/dashboard/segmented.tsx");
    const ticks = /slim \? 3/.test(chart);
    const hit = /Math\.max\(layout\.bodyW, 24\)/.test(chart);
    const menu = /<details/.test(seg);
    return { pass: ticks && hit && menu, detail: !menu ? "EMA chips" : !hit ? "sin hit 24" : !ticks ? "ticks fijos" : "ticks + hit 24 + menú EMA" };
  }
  if (id === "D-FOSS") {
    const lic = existsSync(join(ROOT, "LICENSE"));
    return { pass: false, detail: lic ? "LICENSE en disco; falta 200 anónimo" : "sin LICENSE y repo 404 anónimo" };
  }
  return { pass: false, detail: "manual" };
}

async function liveCheck(id) {
  if (id === "D-TILE-ZIP") {
    const r = await pull(ORIGIN + "/");
    const csp = r.csp.toLowerCase();
    const ok =
      csp.includes("arcgisonline") &&
      csp.includes("opentopomap") &&
      !csp.includes("tile.openstreetmap") &&
      !csp.includes("cartocdn");
    return { pass: ok, detail: ok ? "CSP teselas Esri+OTM" : `csp osm=${csp.includes("tile.openstreetmap")} esri=${csp.includes("arcgisonline")}` };
  }
  if (id === "D-FOSS") {
    const r = await pull("https://github.com/prezpablo/bitacora.btc");
    const lic = existsSync(join(ROOT, "LICENSE"));
    const ok = r.status === 200 && lic;
    return { pass: ok, detail: `github ${r.status} license=${lic}` };
  }
  if (id === "D-SITEMAP") {
    const r = await pull(ORIGIN + "/sitemap.xml");
    const stale = /<lastmod>2026-09-07</.test(r.text);
    return { pass: r.status === 200 && !stale, detail: stale ? "lastmod 2026-09-07" : `sitemap ${r.status}` };
  }
  return { pass: false, detail: "N/D-live" };
}

async function liveGuards() {
  const out = [];
  const hz = await pull(ORIGIN + "/healthz");
  let ok = false;
  try {
    ok = JSON.parse(hz.text).ok === true;
  } catch {
    ok = false;
  }
  out.push({ id: "G-HEALTHZ", pass: hz.status === 200 && ok, detail: `${hz.status} ${hz.text.slice(0, 40)}` });

  const pt = await pull(ORIGIN + "/?lang=pt");
  const lang = (pt.text.match(/<html[^>]*\slang=["']([^"']+)/i) || [])[1] || "";
  const h1 = /Boas-vindas/i.test(pt.text);
  out.push({ id: "G-LANG-PT", pass: lang.toLowerCase() === "pt" && h1, detail: `lang=${lang} h1=${h1}` });

  const csv = await pull(ORIGIN + "/data/map.csv");
  out.push({
    id: "G-CSV",
    pass: csv.status === 200 && !/CARGA-|BIT-/.test(csv.text),
    detail: `${csv.status} carga=${/CARGA-/.test(csv.text)}`,
  });

  const csp = (await pull(ORIGIN + "/")).csp;
  out.push({
    id: "G-FONTS",
    pass: !/fonts\.googleapis\.com/.test(csp),
    detail: csp.includes("googleapis") ? "Google Fonts en CSP" : "sin Google Fonts",
  });
  return out;
}

export async function runDeuda({ live = false, cola } = {}) {
  const doc = cola || loadCola(readFileSync(COLA, "utf8"));
  const rows = [];
  for (const it of doc.items) {
    if (!it.open) {
      rows.push({ id: it.id, pri: it.pri, state: "CERRADO", detail: "cola.open=false" });
      continue;
    }
    if (it.kind === "repo" || it.id === "D-FOSS") {
      const r = repoCheck(it.id);
      if (live && it.kind === "live") {
        const l = await liveCheck(it.id);
        rows.push({ id: it.id, pri: it.pri, state: l.pass ? "CERRADO" : "ABIERTO", detail: l.detail });
      } else if (it.kind === "live" && !live) {
        rows.push({ id: it.id, pri: it.pri, state: r.pass ? "CERRADO" : "ABIERTO", detail: r.detail + " (sin --live)" });
      } else {
        rows.push({ id: it.id, pri: it.pri, state: r.pass ? "CERRADO" : "ABIERTO", detail: r.detail });
      }
      continue;
    }
    if (it.kind === "live" && live) {
      const l = await liveCheck(it.id);
      rows.push({ id: it.id, pri: it.pri, state: l.pass ? "CERRADO" : "ABIERTO", detail: l.detail });
      continue;
    }
    rows.push({ id: it.id, pri: it.pri, state: "ABIERTO", detail: it.kind === "manual" ? "manual" : "sin --live" });
  }
  const guards = live ? await liveGuards() : [];
  return { rows, guards, resume: doc.resume };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const { rows, guards, resume } = await runDeuda({ live: LIVE });
  console.log(`deuda cola · retomar ${resume} · live=${LIVE ? "sí" : "no"}`);
  let open = 0;
  for (const r of rows) {
    if (r.state === "ABIERTO") open += 1;
    console.log(`${r.state.padEnd(8)} ${r.pri.padEnd(3)} ${r.id.padEnd(12)} ${r.detail}`);
  }
  let guardFail = 0;
  for (const g of guards) {
    if (!g.pass) guardFail += 1;
    console.log(`${g.pass ? "GUARD-OK" : "GUARD-FAIL"}  ${g.id.padEnd(12)} ${g.detail}`);
  }
  console.log(`${open} abiertos · ${rows.length - open} cerrados en sonda · guards fail ${guardFail}`);
  if (guardFail) process.exit(1);
}
