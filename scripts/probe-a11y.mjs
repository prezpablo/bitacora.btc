#!/usr/bin/env node
/**
 * WCAG 2.2 AA probe (axe-core) against the live origin.
 *
 *   node scripts/probe-a11y.mjs
 *   PROBE_ORIGIN=https://bitacorabtc.org node scripts/probe-a11y.mjs
 *
 * Exit 1 = critical/serious on a public route (not a site outage).
 * WARN = moderate. Leaflet/globe/chart noise is tagged MAPA.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ORIGIN = (process.env.PROBE_ORIGIN || "https://bitacorabtc.org").replace(/\/$/, "");
const UA = "BitacoraA11yProbe/1 (+https://bitacorabtc.org)";
const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve("axe-core/axe.min.js");

const ROUTES = ["/", "/mapa", "/legal", "/labif", "/?lang=pt"];

const MAP_NOISE = /leaflet|globe|canvas|mapa|chart|velas|heatmap/i;

export function classify(violation, path) {
  const targets = (violation.nodes || []).map((n) => String(n.target || n.html || "")).join(" ");
  const mapish = MAP_NOISE.test(targets) || MAP_NOISE.test(path);
  const impact = violation.impact || "moderate";
  if (mapish && (violation.id === "color-contrast" || violation.id === "nested-interactive" || violation.id === "scrollable-region-focusable")) {
    return "mapa";
  }
  if (impact === "critical" || impact === "serious") return "fail";
  return "warn";
}

export function summarize(results, path) {
  const fail = [];
  const warn = [];
  const mapa = [];
  for (const v of results.violations || []) {
    const nodes = (v.nodes || []).slice(0, 4).map((n) => (n.target || []).join(" ") || (n.html || "").slice(0, 80));
    const row = {
      id: `${path} ${v.id}`,
      impact: v.impact,
      help: v.help,
      wcag: (v.tags || []).filter((t) => /^wcag/.test(t)).join(","),
      nodes,
    };
    const bucket = classify(v, path);
    if (bucket === "fail") fail.push(row);
    else if (bucket === "mapa") mapa.push(row);
    else warn.push(row);
  }
  return { fail, warn, mapa, passes: (results.passes || []).length, incomplete: (results.incomplete || []).length };
}

async function axeRoute(page, path) {
  const res = await page.goto(`${ORIGIN}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.addScriptTag({ path: AXE_PATH });
  const raw = await page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] },
      resultTypes: ["violations", "passes", "incomplete"],
    });
  });
  const skip = await page.locator("a[href='#contenido']").count();
  const h1 = ((await page.locator("h1").first().textContent()) || "").replace(/\s+/g, " ").trim();
  const lang = await page.locator("html").getAttribute("lang");
  return {
    status: res?.status() || 0,
    skip,
    h1,
    lang,
    ...summarize(raw, path),
  };
}

export async function runProbe(origin = ORIGIN) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: UA,
    locale: "es-UY",
  });
  const page = await context.newPage();
  const rows = [];
  try {
    for (const path of ROUTES) {
      rows.push({ path, ...(await axeRoute(page, path)) });
    }
  } finally {
    await browser.close();
  }
  return { origin, rows };
}

function print(report) {
  let fails = 0;
  let warns = 0;
  for (const r of report.rows) {
    const smoke = [
      ["status", r.status === 200, String(r.status)],
      ["skip", r.skip >= 1, String(r.skip)],
      ["h1", Boolean(r.h1) && !/bit[aá]cora\.btc\s*bit[aá]cora/i.test(r.h1), r.h1 || "(sin h1)"],
      ["lang", Boolean(r.lang), r.lang || "(vacío)"],
    ];
    console.log(`\n== ${r.path}  axe pass=${r.passes} incomplete=${r.incomplete}`);
    for (const [id, ok, detail] of smoke) {
      console.log(`${ok ? "OK  " : "FAIL"}  ${r.path} ${id}  ${detail}`);
      if (!ok) fails += 1;
    }
    for (const v of r.fail) {
      fails += 1;
      console.log(`FAIL  ${v.id}  [${v.impact}] ${v.help}  ${v.nodes[0] || ""}`);
    }
    for (const v of r.warn) {
      warns += 1;
      console.log(`WARN  ${v.id}  [${v.impact}] ${v.help}  ${v.nodes[0] || ""}`);
    }
    for (const v of r.mapa) {
      console.log(`MAPA  ${v.id}  [${v.impact}] ${v.help}`);
    }
  }
  return { fails, warns };
}

async function main() {
  const report = await runProbe(ORIGIN);
  const { fails, warns } = print(report);
  console.log(`\n${fails ? "FAIL" : "OK"}  ${ORIGIN}  fail=${fails} warn=${warns}`);
  process.exit(fails ? 1 : 0);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
