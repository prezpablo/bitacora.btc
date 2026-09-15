import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** D-SITEMAP: lastmod = día del build/ZIP, no una fecha congelada. */
export function stampLastmod(xml, day) {
  return xml.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${day}</lastmod>`);
}

const running = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (running) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const file = join(root, "public/sitemap.xml");
  const day = new Date().toISOString().slice(0, 10);
  const xml = readFileSync(file, "utf8");
  const next = stampLastmod(xml, day);
  if (next !== xml) writeFileSync(file, next);
  console.log(`[sitemap] lastmod ${day}`);
}
