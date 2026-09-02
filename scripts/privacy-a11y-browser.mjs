#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.PRIVACY_A11Y_URL || "http://127.0.0.1:8080";
const OUT = "/workspace/screenshots";
mkdirSync(OUT, { recursive: true });

const fail = [];
const pass = [];
function ok(name) {
  pass.push(name);
}
function bad(name, detail) {
  fail.push(`${name}: ${detail}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(() => {
  try {
    if (!sessionStorage.getItem("bitacora-privacy-qa")) {
      localStorage.removeItem("bitacora-storage");
      sessionStorage.setItem("bitacora-privacy-qa", "1");
    }
  } catch {
    /* */
  }
});
const page = await context.newPage();
const googleHits = [];
page.on("request", (req) => {
  const u = req.url();
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(u)) googleHits.push(u);
});

async function goto(path) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  return res;
}

try {
  const home = await goto("/");
  if (!home || home.status() >= 400) bad("home status", String(home?.status()));
  else ok("home 200");

  const skip = page.locator("a[href='#contenido']").first();
  if ((await skip.count()) !== 1) bad("skip-link", "missing");
  else {
    ok("skip-link in DOM");
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => document.activeElement?.getAttribute("href"));
    if (active === "#contenido") ok("skip-link first Tab");
    else bad("skip-link first Tab", `focused ${active}`);
  }

  const banner = page.getByRole("dialog");
  try {
    await banner.waitFor({ state: "visible", timeout: 8000 });
  } catch {
    /* counted below */
  }
  if (await banner.isVisible()) {
    ok("storage banner visible (unset)");
    for (const href of ["/legal#cookies", "/legal#privacidad"]) {
      if ((await banner.locator(`a[href="${href}"]`).count()) < 1) bad("banner link", href);
      else ok(`banner ${href}`);
    }
    await page.screenshot({ path: `${OUT}/privacy-banner.png`, fullPage: false });
  } else bad("storage banner", "not visible on first visit");

  const footerNav = page.locator("footer nav[aria-label]");
  for (const href of ["/legal#aviso", "/legal#privacidad", "/legal#cookies", "/legal#accesibilidad"]) {
    const n = await page.locator(`footer a[href="${href}"]`).count();
    if (n < 1) bad("home footer", href);
    else ok(`home footer ${href}`);
  }

  const h1 = await page.locator("h1 .sr-only").first().textContent();
  if (h1?.includes("Bitácora.btc")) ok("H1 sr-only Bitácora.btc");
  else bad("H1 sr-only", h1 || "empty");

  if ((await page.locator("section#legal").count()) > 0) bad("home legal embed", "section#legal still on home");
  else ok("home does not embed legal");

  await goto("/legal");
  const navLinks = await page.locator("header nav a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  if (navLinks.length === 2 && navLinks.includes("#privacidad") && navLinks.includes("#contacto")) {
    ok("legal menu only Privacidad + Contacto");
  } else bad("legal menu", JSON.stringify(navLinks));
  if ((await page.locator("#contacto").count()) < 1) bad("legal contact", "missing");
  else ok("legal has contact form");
  const ids = ["aviso", "privacidad", "cookies", "accesibilidad"];
  for (const id of ids) {
    const el = page.locator(`#${id}`);
    if ((await el.count()) !== 1) bad(`legal #${id}`, "missing");
    else ok(`legal #${id}`);
  }
  const legalText = await page.locator("#legal").innerText();
  if (/Pablo Daniel Perez Correa/i.test(legalText)) bad("legal name", "civil name leaked");
  else ok("legal hides civil name");
  if (!/Colonia del Sacramento/.test(legalText)) bad("legal domicile", "city missing");
  else ok("legal shows Colonia");
  if (!/18\.331/.test(legalText)) bad("legal ley", "18.331 missing");
  else ok("legal cites 18.331");
  if ((await page.locator("#privacidad table").count()) < 1) bad("legal table", "missing");
  else ok("legal treatments table");
  await page.goto(`${BASE}/legal#accesibilidad`);
  await page.waitForTimeout(300);
  const a11yTop = await page.locator("#accesibilidad").evaluate((el) => el.getBoundingClientRect().top);
  if (a11yTop < 700) ok("anchor #accesibilidad scrolls");
  else bad("anchor scroll", `top=${Math.round(a11yTop)}`);
  await page.screenshot({ path: `${OUT}/privacy-legal.png`, fullPage: false });

  await goto("/");
  await page.locator("#contacto").scrollIntoViewIfNeeded();
  const contactBox = page.locator("#privacy-contact");
  await contactBox.waitFor({ state: "visible", timeout: 15000 });
  const contactSubmit = page.locator("#contacto button[type='submit']");
  if (await contactSubmit.isDisabled()) ok("contact submit disabled without privacy");
  else bad("contact submit", "enabled without privacy");
  const required = await contactBox.getAttribute("aria-required");
  if (required === "true") ok("contact checkbox aria-required");
  else bad("contact aria-required", String(required));
  await page.screenshot({ path: `${OUT}/privacy-contact.png`, fullPage: false });

  await page.locator("#comunidad").scrollIntoViewIfNeeded();
  const pinBox = page.locator("#privacy-pin");
  await pinBox.waitFor({ state: "visible", timeout: 15000 });
  const pinSubmit = page.locator("#comunidad button[type='submit']");
  if (await pinSubmit.isDisabled()) ok("pin submit disabled without privacy");
  else bad("pin submit", "enabled without privacy");

  const mapa = await goto("/mapa");
  if (!mapa || mapa.status() >= 400) bad("mapa status", String(mapa?.status()));
  else ok("mapa 200");
  if ((await page.locator("footer a[href='/legal#privacidad']").count()) < 1) bad("mapa footer", "no privacy link");
  else ok("mapa footer legal");
  if ((await page.locator("a[href='#contenido']").count()) < 1) bad("mapa skip", "missing");
  else ok("mapa skip-link");

  const labif = await goto("/labif");
  if (!labif || labif.status() >= 400) bad("labif status", String(labif?.status()));
  else ok("labif 200");
  for (const href of ["/legal#aviso", "/legal#privacidad", "/legal#cookies", "/legal#accesibilidad"]) {
    if ((await page.locator(`a[href="${href}"]`).count()) < 1) bad("labif footer", href);
    else ok(`labif ${href}`);
  }

  await goto("/");
  await banner.waitFor({ state: "visible" }).catch(() => {});
  if (await page.getByRole("dialog").isVisible()) {
    await page.getByRole("button", { name: /Solo necesario|Necessary only|Só necessário/i }).click();
    await page.waitForTimeout(200);
    const choice = await page.evaluate(() => localStorage.getItem("bitacora-storage"));
    if (choice === "min") ok("banner Solo necesario persists");
    else bad("banner persist", String(choice));
    if (await page.getByRole("dialog").isVisible()) bad("banner dismiss", "still visible");
    else ok("banner dismisses");
  }

  if (googleHits.length) bad("Google Fonts network", googleHits.slice(0, 3).join(", "));
  else ok("no Google Fonts requests");
} catch (err) {
  bad("runner", err instanceof Error ? err.stack || err.message : String(err));
} finally {
  await browser.close();
}

const report = { ok: fail.length === 0, pass, fail };
console.log(JSON.stringify(report, null, 2));
process.exit(fail.length ? 1 : 0);
