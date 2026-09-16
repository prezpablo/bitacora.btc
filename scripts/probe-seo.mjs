#!/usr/bin/env node
/**
 * Technical SEO audit against the live origin (HTML of the first byte).
 *
 *   node scripts/probe-seo.mjs
 *   PROBE_ORIGIN=https://bitacorabtc.org PROBE_STRICT=1 node scripts/probe-seo.mjs
 *
 * Exit 1 = P0 broken (identity per URL, 404, robots/sitemap).
 * DEGRADA = P1/P2 (H1, trailing slash, lastmod) — not a site outage.
 */
import { pathToFileURL } from "node:url";

const ORIGIN = (process.env.PROBE_ORIGIN || "https://bitacorabtc.org").replace(/\/$/, "");
const TIMEOUT = Number(process.env.PROBE_TIMEOUT_MS || 12_000);
const STRICT = process.env.PROBE_STRICT === "1";
const UA = "BitacoraSeoProbe/1 (+https://bitacorabtc.org)";

const EXPECT = {
  "/": {
    title: "Bitácora.btc | Mapa de comunidades y comercios Bitcoin en Latinoamérica",
    canonical: `${ORIGIN}/`,
    lang: "es",
    h1: /bit[aá]cora/i,
  },
  "/mapa": {
    title: "Mapa Bitcoin Latam | Bitácora.btc",
    canonical: `${ORIGIN}/mapa`,
    lang: "es",
    h1: /mapa bitcoin|bitcoin map/i,
  },
  "/legal": {
    title: "Aviso, privacidad y cookies | Bitácora.btc",
    canonical: `${ORIGIN}/legal`,
    lang: "es",
    h1: /privacidad|privacy|privacidade/i,
  },
  "/labif": {
    title: "LABIF · Bitácora.btc",
    canonical: `${ORIGIN}/labif`,
    lang: "es",
    h1: /bit[aá]cora|labif/i,
  },
  "/mapa?lang=pt": {
    title: "Mapa Bitcoin Latam | Bitácora.btc",
    canonical: `${ORIGIN}/mapa?lang=pt`,
    lang: "pt",
    h1: /mapa bitcoin|bitcoin map/i,
  },
  "/legal?lang=en": {
    title: "Legal notice, privacy and cookies | Bitácora.btc",
    canonical: `${ORIGIN}/legal?lang=en`,
    lang: "en",
    h1: /privacidad|privacy|privacidade/i,
  },
};

export function decodeEntities(value) {
  return String(value)
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

export function attr(tag, name) {
  const m = String(tag).match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

export function parseHead(html) {
  const text = String(html || "");
  const lang = (text.match(/<html[^>]*\slang=["']([^"']+)/i) || [])[1]?.toLowerCase() || "";
  const title = decodeEntities((text.match(/<title>([^<]*)<\/title>/i) || [])[1] || "");
  const metas = {};
  for (const m of text.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = (attr(tag, "property") || attr(tag, "name")).toLowerCase();
    if (key) metas[key] = attr(tag, "content");
  }
  const links = [];
  for (const m of text.matchAll(/<link\b[^>]*>/gi)) {
    links.push({
      rel: attr(m[0], "rel").toLowerCase(),
      href: attr(m[0], "href"),
      hreflang: (attr(m[0], "hreflang") || attr(m[0], "hrefLang")).toLowerCase(),
    });
  }
  const canonical = links.find((l) => l.rel === "canonical")?.href || "";
  const hreflang = Object.fromEntries(
    links.filter((l) => l.rel === "alternate" && l.hreflang).map((l) => [l.hreflang, l.href]),
  );
  const ldBlocks = [...text.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1],
  );
  let graph = [];
  for (const raw of ldBlocks) {
    try {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data["@graph"])) graph = graph.concat(data["@graph"]);
      else if (data) graph.push(data);
    } catch {
      /* ignore */
    }
  }
  const types = graph.map((n) => n?.["@type"]).filter(Boolean);
  const webPage = graph.find((n) => n?.["@type"] === "WebPage") || null;
  const h1 = [...text.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    decodeEntities(m[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim(),
  );
  return { lang, title, metas, canonical, hreflang, types, webPage, h1, grokJs: /grok-app-builder\/extensions\.js/.test(text) };
}

export function sitemapLocs(xml) {
  return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());
}

export function jpegSize(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  let i = 2;
  while (i < b.length - 8) {
    if (b[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = b[i + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = b.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

async function pull(url, extra = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: extra.redirect || "follow",
      headers: { "user-agent": UA, accept: extra.accept || "*/*" },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const text = extra.bin ? "" : buf.toString("utf8");
    return {
      ok: res.ok,
      status: res.status,
      ms: Date.now() - t0,
      type: res.headers.get("content-type") || "",
      location: res.headers.get("location") || "",
      hsts: res.headers.get("strict-transport-security") || "",
      encoding: res.headers.get("content-encoding") || "",
      text,
      buf,
      bytes: buf.length,
      final: res.url,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - t0,
      type: "",
      location: "",
      hsts: "",
      encoding: "",
      text: "",
      buf: Buffer.alloc(0),
      bytes: 0,
      final: url,
      err: err instanceof Error ? err.message : "fail",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function runSeoProbe({ origin = ORIGIN, fetchPage = pull } = {}) {
  const core = [];
  const warn = [];
  const add = (list, id, pass, detail) => {
    list.push({ id, pass, detail });
  };

  for (const [path, want] of Object.entries(EXPECT)) {
    const r = await fetchPage(`${origin}${path}`);
    const h = parseHead(r.text);
    const pageOk = r.status === 200;
    add(core, `${path} 200`, pageOk, `${r.status} ${r.ms}ms ${r.bytes}b`);
    add(core, `${path} lang`, h.lang === want.lang, `lang=${h.lang || "?"}`);
    add(core, `${path} title`, h.title === want.title, `"${h.title.slice(0, 64)}"`);
    add(core, `${path} canonical`, h.canonical === want.canonical, h.canonical || "(vacío)");
    const clean = path.split("?")[0] || "/";
    const wantPt = clean === "/" ? `${origin}/?lang=pt` : `${origin}${clean}?lang=pt`;
    add(core, `${path} hreflang`, h.hreflang.pt === wantPt, h.hreflang.pt || JSON.stringify(h.hreflang));
    const pageUrl = h.webPage?.url || "";
    add(core, `${path} jsonld WebPage`, pageUrl === want.canonical, `url=${pageUrl || "?"}`);
    const hasFaq = h.types.includes("FAQPage");
    add(core, `${path} jsonld FAQ`, clean === "/" ? hasFaq : !hasFaq, `FAQPage=${hasFaq}`);
    add(core, `${path} og:url`, (h.metas["og:url"] || "") === want.canonical, h.metas["og:url"] || "(vacío)");
    add(core, `${path} og:title`, Boolean(h.metas["og:title"]), (h.metas["og:title"] || "").slice(0, 64));
    add(core, `${path} og:description`, Boolean(h.metas["og:description"]), h.metas["og:description"] ? "sí" : "(vacío)");
    add(core, `${path} twitter:image`, Boolean(h.metas["twitter:image"]), h.metas["twitter:image"] ? "sí" : "(vacío)");
    add(core, `${path} grok.js`, !h.grokJs, h.grokJs ? "residual" : "limpio");
    const h1 = h.h1[0] || "";
    const h1Ok = h.h1.length === 1 && want.h1.test(h1) && !/bit[aá]cora\.btc\s*bit[aá]cora/i.test(h1);
    add(warn, `${path} h1`, h1Ok, h.h1.join(" | ") || "(sin h1)");
  }

  {
    const r = await fetchPage(`${origin}/no-existe-seo-probe`);
    const h = parseHead(r.text);
    add(core, "404 status", r.status === 404, String(r.status));
    add(core, "404 noindex", /noindex/i.test(h.metas.robots || ""), h.metas.robots || "(vacío)");
    const homeCanon = h.canonical === `${origin}/` || h.canonical === `${origin}`;
    add(core, "404 sin canonical home", !homeCanon, h.canonical || "(sin canonical)");
    add(warn, "404 title propio", /encontrado|not found|404/i.test(h.title) || !/Latinoam|Latin America/i.test(h.title), h.title || "(vacío)");
    add(warn, "404 skip #contenido", /href=["']#contenido["']/.test(r.text) && /id=["']contenido["']/.test(r.text), /#contenido/.test(r.text) ? "skip" : "sin skip");
    add(warn, "404 link LICENSE", r.text.includes("/LICENSE"), r.text.includes("/LICENSE") ? "/LICENSE" : "no");
  }

  {
    const r = await fetchPage(`${origin}/robots.txt`);
    add(core, "robots sitemap", r.status === 200 && r.text.includes(`Sitemap: ${origin}/sitemap.xml`), `${r.status}`);
  }

  {
    const r = await fetchPage(`${origin}/sitemap.xml`);
    const locs = sitemapLocs(r.text);
    add(core, "sitemap rutas", ["/mapa", "/legal", "/labif", "/LICENSE"].every((p) => locs.some((l) => l.endsWith(p))), locs.join(" "));
    add(core, "sitemap hreflang mapa", r.text.includes(`${origin}/mapa?lang=pt`), "mapa?lang=pt");
    add(warn, "sitemap no duplica ?lang= como loc", !locs.includes(`${origin}/?lang=es`) && !locs.includes(`${origin}/?lang=pt`), locs.filter((l) => l.includes("?lang=")).join(" ") || "ok");
    const last = (r.text.match(/<lastmod>([^<]+)/) || [])[1] || "?";
    add(core, "sitemap lastmod no-07", last !== "2026-09-07", last);
    add(warn, "sitemap lastmod fresco", /2026-09-1|2026-1/.test(r.text), last);
  }

  {
    const r = await fetchPage(`${origin}/llms.txt`);
    add(core, "llms /mapa", r.status === 200 && r.text.includes(`${origin}/mapa`) && !r.text.includes(`${origin}/#mapa`), r.status === 200 ? "ruta /mapa" : String(r.status));
  }

  {
    const r = await fetchPage(`${origin}/og.jpg`, { bin: true });
    const dim = jpegSize(r.buf);
    add(core, "og.jpg 1200x630", r.status === 200 && dim?.width === 1200 && dim?.height === 630, `${r.status} ${dim ? `${dim.width}x${dim.height}` : "?"} ${r.bytes}b`);
  }

  {
    const r = await fetchPage(`${origin}/`, { accept: "text/html" });
    add(warn, "HSTS", /max-age=\d+/.test(r.hsts), r.hsts || "(vacío)");
  }

  {
    const r = await fetchPage(`https://www.bitacorabtc.org/`, { redirect: "follow" });
    add(core, "www → apex", r.ok && new URL(r.final).hostname === "bitacorabtc.org", r.final);
  }

  {
    const r = await fetchPage(`${origin}/mapa/`, { redirect: "manual" });
    const loc = (r.location || r.final || "").replace(/\/$/, "");
    add(
      warn,
      "/mapa/ no duplica",
      [301, 308, 307].includes(r.status) || loc === `${origin}/mapa`,
      `${r.status} ${r.location || r.final}`,
    );
  }

  return { core, warn, origin };
}

function printReport({ core, warn, origin }) {
  for (const row of core) console.log(`${row.pass ? "OK  " : "FAIL"}  ${row.id}  ${row.detail}`);
  for (const row of warn) console.log(`${row.pass ? "OK  " : "WARN"}  ${row.id}  ${row.detail}`);
  const coreFail = core.filter((x) => !x.pass);
  const warnFail = warn.filter((x) => !x.pass);
  console.log("");
  console.log(`core ${core.filter((x) => x.pass).length}/${core.length}  warn ${warn.filter((x) => x.pass).length}/${warn.length}  origin ${origin}`);
  if (coreFail.length) {
    console.log("SEO P0 FAIL:", coreFail.map((x) => x.id).join(", "));
    process.exitCode = 1;
  } else if (warnFail.length) {
    console.log("SEO DEGRADA:", warnFail.map((x) => x.id).join(", "));
  } else {
    console.log("SEO P0 OK");
  }
  if (STRICT && warnFail.length) {
    console.log("STRICT: warnings count as fail");
    process.exitCode = 1;
  }
}

const isMain =
  Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  printReport(await runSeoProbe());
}
