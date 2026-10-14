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
    const map = read("src/components/map/spend-map.tsx") + read("src/domain/map-tiles.ts") + read("deploy/Caddyfile");
    const esri = /arcgisonline|World_Street_Map/.test(map);
    const off = /openfreemap|pmtiles/i.test(map);
    return { pass: !esri && off, detail: esri ? "sigue Esri" : off ? "OpenFreeMap/PMTiles" : "sin tesela soberana" };
  }
  if (id === "D-QA") {
    const ts = read("tsconfig.json");
    const q = read("scripts/quality.mjs");
    const es = read("eslint.config.mjs");
    const ok =
      /allowImportingTsExtensions/.test(ts) &&
      q.includes('id: "typecheck"') &&
      /react-hooks\/exhaustive-deps": "off"/.test(es);
    return { pass: ok, detail: ok ? "tsc+eslint full gate" : "quality:full aún DEGRADA" };
  }
  if (id === "D-PWA") {
    const root = read("src/routes/__root.tsx");
    const grok = /\/__grok\//.test(root);
    return { pass: !grok, detail: grok ? "manifest /__grok/" : "PWA propio" };
  }
  if (id === "D-CSP-IMG") {
    const caddy = read("deploy/Caddyfile");
    const img = read("src/domain/map-csv.ts");
    const wild = /img-src[^"]*\shttps:\s/.test(caddy);
    const proxy = /\/logo\?u=/.test(img);
    return { pass: !wild && proxy, detail: wild ? "img-src https:" : proxy ? "allowlist + /logo" : "sin proxy /logo" };
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
  if (id === "D-A11Y-24") {
    const header = read("src/components/site-header.tsx");
    const labif = read("src/components/labif-dossier.tsx");
    const hitDatos = /href="\/#datos"[^>]*min-w-6/.test(header);
    const kick = /\.kicker \{ color: #9a5600/.test(labif);
    return { pass: hitDatos && kick, detail: !hitDatos ? "#datos sin min-w-6" : kick ? "datos 24px + kicker" : "kicker naranja claro" };
  }
  if (id === "D-FOSS") {
    const lic = existsSync(join(ROOT, "LICENSE"));
    return { pass: false, detail: lic ? "LICENSE en disco; falta 200 anónimo" : "sin LICENSE y repo 404 anónimo" };
  }
  if (id === "L-N1") {
    const parties = read("src/domain/third-parties.ts");
    const ui = read("src/components/dashboard/legal-eu.tsx");
    const gh = /name: "GitHub"[\s\S]{0,80}side: "recipient"/.test(parties);
    const gm = /name: "Google \(Gmail\)"[\s\S]{0,80}side: "recipient"/.test(parties);
    const shown = ui.includes('side="recipient"');
    const ok = gh && gm && shown;
    return { pass: ok, detail: ok ? "GitHub y Gmail fuera de no-reciben" : "siguen en side server" };
  }
  if (id === "L-XFER") {
    const form = read("src/components/dashboard/contact.tsx");
    const legal = read("src/domain/legal-eu.ts");
    const ok = form.includes("privacy-transfer") && form.includes("consentTransfer") && !legal.includes("casilla de privacidad documenta tu consentimiento a estas transferencias");
    return { pass: ok, detail: ok ? "casilla FormSubmit aparte" : "sigue una sola casilla" };
  }
  if (id === "L-IP") {
    const row = read("src/domain/third-parties.ts");
    const ok = /name: "FormSubmit"[\s\S]{0,280}navegador también le envía tu IP/.test(row);
    return { pass: ok, detail: ok ? "FormSubmit declara la IP" : "el renglón no nombra la IP" };
  }
  if (id === "A-01") {
    const cfg = read("src/domain/legal-config.ts");
    const legal = read("src/domain/legal-eu.ts");
    const i18n = read("src/lib/i18n.ts");
    const ok =
      /address: "\[DOMICILIO_NOTIFICACIONES\]"/.test(cfg) &&
      /city: "Colonia del Sacramento, Colonia, Uruguay"/.test(cfg) &&
      /se agregará cuando esté constituido/.test(legal) &&
      !/y el domicilio de notificación figuran en esta página/.test(legal.split("NOTICE_READY")[0] || legal) &&
      /legalWhoPending:/.test(i18n);
    return { pass: ok, detail: ok ? "sin domicilio de notificación publicado" : "el aviso todavía dice que el domicilio figura" };
  }
  if (id === "L-URCDP") {
    const cfg = read("src/domain/legal-config.ts");
    const legal = read("src/domain/legal-eu.ts");
    const ok =
      /expediente: "\[N\.º TRÁMITE\]"/.test(cfg) &&
      /filingDate: "\[FECHA_PRESENTACION\]"/.test(cfg) &&
      !/Número de trámite: en trámite/.test(legal) &&
      /todavía no asignó número de trámite/.test(legal);
    return { pass: ok, detail: ok ? "sin número de trámite inventado" : "sigue «en trámite» como número" };
  }
  if (id === "L-PAIS") {
    const parties = read("src/domain/third-parties.ts");
    const ok =
      !/no declarado/.test(parties) &&
      /countrySource: "https:\/\/openfreemap.org\/tos\/"/.test(parties) &&
      /país no informado por el proveedor/.test(parties) &&
      /lingva\.ml/.test(parties);
    return { pass: ok, detail: ok ? "país con fuente o no informado" : "sigue no declarado" };
  }
  if (id === "A-04") {
    const legal = read("src/domain/legal-eu.ts");
    const ok =
      /Ley 18\.331, art\. 23, inciso 2º, literal A/.test(legal) &&
      /Act 18\.331, art\. 23, subsection 2, letter A/.test(legal) &&
      /Lei 18\.331, art\. 23, inciso 2º, alínea A/.test(legal) &&
      !/\[PLAZO_LOGS\]|\[PLAZO_FORMSUBMIT\]/.test(legal);
    return { pass: ok, detail: ok ? "art. 23 inciso 2º literal A" : "sigue la cita corta" };
  }
  if (id === "A-07") {
    const clock = read("src/domain/market-clock.ts");
    const desk = read("src/components/dashboard/desk.tsx");
    const i18n = read("src/lib/i18n.ts");
    const ok =
      /America\/Montevideo/.test(clock) &&
      /timeZoneName: "short"/.test(clock) &&
      /formatMarketClock/.test(desk) &&
      /notQuote: "no es cotización"/.test(i18n) &&
      /source === "modelo" \? t\("notQuote"\)/.test(desk);
    return { pass: ok, detail: ok ? "hora con zona; la serie modelo no es cotización" : "falta zona o el aviso de la serie" };
  }
  if (id === "A-08") {
    const legal = read("src/domain/legal-eu.ts");
    const ok =
      /"11\. Anuncios"/.test(legal) &&
      /"12\. Disputes"/.test(legal) &&
      /"14\. Mudanças"/.test(legal) &&
      /5 días hábiles/.test(legal) &&
      /no se afirma aquí/.test(legal) &&
      !/sigue la ODbL/.test(legal) &&
      !/Estas diez reglas/.test(legal);
    return { pass: ok, detail: ok ? "14 reglas; sin plazo de disputa inventado" : "siguen 10 reglas o un plazo inventado" };
  }
  if (id === "A-09") {
    const log = read("src/infrastructure/consent-log.ts");
    const server = read("src/infrastructure/server-fns.ts");
    const contact = read("src/components/dashboard/contact.tsx");
    const ok =
      /function safeIpHash/.test(log) &&
      /function readSentConsent/.test(log) &&
      /textVersion: LEGAL\.consentVersion/.test(contact) &&
      /form: "contact"/.test(contact) &&
      !/recordConsent\("publish"/.test(server);
    return { pass: ok, detail: ok ? "versión y formulario en el envío; IP en claro no" : "el envío no manda versión o formulario" };
  }
  if (id === "A-10") {
    const i18n = read("src/lib/i18n.ts");
    const page = read("src/components/dashboard/legal-eu.tsx");
    const ok =
      /legalTitle: "Textos legales"/.test(i18n) &&
      /legalTitle: "Legal"/.test(i18n) &&
      /legalTitle: "Textos legais"/.test(i18n) &&
      /2\.0, 2\.2 y 2\.4/.test(i18n) &&
      /legalFilled\(LEGAL\.vigencia\)/.test(page) &&
      !/FECHA_VIGENCIA/.test(page);
    return { pass: ok, detail: ok ? "título Textos legales; vigencia oculta" : "sigue el título viejo o la fecha" };
  }
  if (id === "A-11") {
    const legal = read("src/domain/legal-eu.ts");
    const todo = read("docs/TODO-legal.md");
    const ok = !/Brechas en curso|Open gaps|Falhas em curso|\nPlan:|\nPlano:/.test(legal) && /A-11/.test(todo);
    return { pass: ok, detail: ok ? "brechas y plan fuera de /legal" : "siguen publicadas" };
  }
  if (id === "A-13") {
    const legal = read("src/domain/legal-eu.ts");
    const ok =
      !/cuando corresponda|quando for o caso|where it applies, the people/.test(legal) &&
      /en 24 horas se mitiga/.test(legal) &&
      /within 72 hours/.test(legal);
    return { pass: ok, detail: ok ? "aviso sin «cuando corresponda»" : "sigue el aviso condicional" };
  }
  if (id === "A-14") {
    const src = read("src/infrastructure/retention.ts");
    const job = read("scripts/retain.mjs");
    const ok = /PIN_RETAIN_MS = 7 \* DAY/.test(src) && /DELETE FROM pins/.test(src) && /RETAIN_MS = 30 \* DAY/.test(src) && /loadPins/.test(job) && !/gmail/i.test(src);
    return { pass: ok, detail: ok ? "pines a 7 días; códigos a 30; sin Gmail" : "el cron no separa los plazos" };
  }
  if (id === "A-15") {
    const legal = read("src/domain/legal-eu.ts");
    const ok =
      /bitacora-storage", "localStorage"/.test(legal) &&
      /bitacora-map-pending", "localStorage y sessionStorage/.test(legal) &&
      /El idioma no se guarda/.test(legal) &&
      !/bitacora-hit/.test(legal);
    return { pass: ok, detail: ok ? "tabla de claves reales; el pulso no entra" : "falta la tabla o entra una clave que no es" };
  }
  if (id === "A-17") {
    const ui = read("src/components/map/captcha.tsx");
    const i18n = read("src/lib/i18n.ts");
    const ok = /speakChallenge/.test(ui) && /mailto:\$\{LEGAL\.a11yEmail\}/.test(ui) && /captchaMail:/.test(i18n);
    return { pass: ok, detail: ok ? "mailto junto al captcha; el audio queda" : "falta el correo o se fue el audio" };
  }
  if (id === "A-18") {
    const legal = read("src/domain/legal-eu.ts");
    const leads = [...legal.matchAll(/\n  lead: "([^"]+)"/g)].map((m) => m[1] || "");
    const ok = leads.length === 3 && leads.every((lead) => /18\.331/.test(lead) && /anexo|annex/.test(lead) && !/RGPD|GDPR|ePrivacy/.test(lead)) && /13\.709\/2018/.test(legal) && /25\.326/.test(legal);
    return { pass: ok, detail: ok ? "apertura uruguaya; anexo ya escrito" : "la apertura sigue con el RGPD" };
  }
  if (id === "A-21") {
    const legal = read("src/domain/legal-eu.ts");
    const es = legal.slice(0, legal.indexOf("const en"));
    const ok = /lista de direcciones permitidas/.test(es) && !/allowlist|lista de fundadores|Impact Fund/.test(es) && /también en LABIF/.test(es);
    return { pass: ok, detail: ok ? "términos en castellano; LABIF sin definir" : "sigue un término en inglés o se definió LABIF" };
  }
  if (id === "A-22") {
    const seg = read("src/components/dashboard/segmented.tsx");
    const css = read("src/styles.css");
    const ok = /min-h-6 min-w-6/.test(seg) && !/min-h-11/.test(seg) && /min-height: 1\.5rem/.test(css) && !/wcag22aaa/.test(read("scripts/probe-a11y.mjs"));
    return { pass: ok, detail: ok ? "piso 24 px; el corte no sube a 44" : "falta el piso o se subió a 44" };
  }
  if (id === "A-23") {
    const map = read("src/components/map/spend-map.tsx");
    const desk = read("src/components/dashboard/desk.tsx");
    const globe = read("src/components/map/world-globe.tsx");
    const ok = /id="map-list-title"/.test(map) && !/<details[\s\S]{0,180}mapListTitle/.test(map) && /summary=\{priceSum\}/.test(desk) && /Hora de Uruguay/.test(read("src/lib/i18n.ts")) && /tabIndex=\{0\}/.test(globe);
    return { pass: ok, detail: ok ? "lista visible y precio escrito; globo en el teclado" : "falta la lista, el precio o se escondió el globo" };
  }
  if (id === "A-25") {
    const i18n = read("src/lib/i18n.ts");
    const legal = read("src/domain/legal-eu.ts");
    const ok = !/privacyArt13/.test(i18n) && /Información del art\. 13/.test(legal);
    return { pass: ok, detail: ok ? "clave muerta fuera; el aviso del art. 13 queda" : "la clave sigue o se tocó el aviso" };
  }
  if (id === "A-26") {
    const ui = read("src/components/contribute-qr.tsx");
    const i18n = read("src/lib/i18n.ts");
    const ok = /t\("donate"\)/.test(ui) && /t\("contributeGift"\)/.test(ui) && /sin contraprestación/.test(i18n) && !/size-6/.test(ui);
    return { pass: ok, detail: ok ? "Donar abre la ficha; el aviso está junto al QR" : "sigue el QR a la vista o falta el aviso" };
  }
  if (id === "A-29") {
    const contact = read("src/components/dashboard/contact.tsx");
    const captcha = read("src/components/map/captcha.tsx");
    const ok = /id=\{errId\} role="alert"/.test(contact) && /fieldErr\(errId, emailBad\)/.test(contact) && /id=\{failId\} role="alert"/.test(captcha);
    return { pass: ok, detail: ok ? "el error se anuncia y queda ligado al campo" : "falta el aviso o el lazo al campo" };
  }
  if (id === "A-31") {
    const legal = read("src/domain/legal-eu.ts");
    const ok = !/niños y adolescentes/i.test(legal) && !/art\.\s*14/.test(legal);
    return { pass: ok, detail: ok ? "no se nombra el art. 14 ni «niños y adolescentes»" : "entró el art. 14 o la frase sin verificar" };
  }
  if (id === "A-30") {
    const legal = read("src/domain/legal-eu.ts");
    const ok = /14 de octubre de 2026/.test(legal) && /14 October 2026/.test(legal) && /14 de outubro de 2026/.test(legal) && /No es auditoría externa/.test(legal);
    return { pass: ok, detail: ok ? "autoevaluación al 14 de octubre de 2026, sin certificado" : "la fecha vieja sigue o se afirmó un certificado" };
  }
  if (id === "L-VALOR") {
    const legal = read("src/domain/legal-eu.ts");
    const ok = /impugnar esa valoración \(art\. 16\)/.test(legal) && /challenge that valuation \(art\. 16\)/.test(legal) && /impugnar essa valoração \(art\. 16\)/.test(legal) && !/arts\. 14 a 16/.test(legal);
    return { pass: ok, detail: ok ? "el art. 16 nombra impugnar la valoración; el plazo de 5 días queda en 14 y 15" : "los derechos siguen sin el art. 16" };
  }
  if (id === "L-MKT-COPY") {
    const i18n = read("src/lib/i18n.ts");
    const desk = read("src/components/dashboard/desk.tsx");
    const ok = !/barre shorts|barre longs|sweeps shorts|sweeps longs|varre shorts|varre longs/.test(i18n) && !/pocUp|pocDown/.test(desk);
    return { pass: ok, detail: ok ? "el punto de control no dice que el precio barre shorts ni longs" : "la frase sigue en el mercado" };
  }
  return { pass: false, detail: "manual" };
}

async function liveCheck(id) {
  if (id === "D-TILE-ZIP") {
    const r = await pull(ORIGIN + "/");
    const csp = r.csp.toLowerCase();
    const ok =
      csp.includes("openfreemap") &&
      csp.includes("opentopomap") &&
      !csp.includes("arcgisonline") &&
      !csp.includes("tile.openstreetmap") &&
      !csp.includes("cartocdn");
    return { pass: ok, detail: ok ? "CSP teselas OFM+OTM" : `csp osm=${csp.includes("tile.openstreetmap")} ofm=${csp.includes("openfreemap")} esri=${csp.includes("arcgisonline")}` };
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
