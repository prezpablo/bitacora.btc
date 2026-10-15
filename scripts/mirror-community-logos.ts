import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { isSvgPayload } from "../src/infrastructure/logo-bytes.ts";
import { jpegWithoutExif } from "../src/infrastructure/logo-exif.ts";
import { FED_LOGO_DIR, fedLogoFile, fedLogoName } from "../src/infrastructure/fed-logos.ts";
import { openSqlite } from "../src/infrastructure/sqlite.ts";
import { isPublicHttp, urlResolvesPublic } from "../src/infrastructure/safe-fetch.ts";

type Row = { id: string; logo: string };

const EDGE = 160;
const MAX = 2_000_000;
const limit = Number(process.env.BITACORA_LOGO_LIMIT || 0);

function rows(): Row[] {
  return openSqlite()
    .prepare("SELECT id, logo FROM catalog WHERE tipo = 'community' AND logo LIKE 'https://%' ORDER BY id")
    .all() as Row[];
}

async function pull(url: string) {
  if (!isPublicHttp(url) || !(await urlResolvesPublic(url))) return null;
  const res = await fetch(url, {
    headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": "bitacora.btc/1.0" },
    signal: AbortSignal.timeout(12_000),
    redirect: "manual",
  });
  if (!res.ok) return null;
  const type = (res.headers.get("content-type") || "").split(";")[0].trim();
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > MAX || isSvgPayload(type, buf)) return null;
  return buf;
}

async function one(row: Row) {
  const name = fedLogoName(row.id);
  const file = name ? fedLogoFile(name) : "";
  if (!file) return "skip";
  if (existsSync(file)) {
    openSqlite().prepare("UPDATE catalog SET logo = ? WHERE id = ? AND tipo = 'community'").run(`/logos/fed/${name}`, row.id);
    return "have";
  }
  const buf = await pull(row.logo);
  if (!buf) return "miss";
  const jpeg = await jpegWithoutExif(buf, false, EDGE);
  if (!jpeg?.length || isSvgPayload("image/jpeg", jpeg)) return "miss";
  writeFileSync(file, jpeg);
  openSqlite().prepare("UPDATE catalog SET logo = ? WHERE id = ? AND tipo = 'community'").run(`/logos/fed/${name}`, row.id);
  return "ok";
}

mkdirSync(FED_LOGO_DIR, { recursive: true });
const list = rows().slice(0, limit > 0 ? limit : undefined);
let ok = 0;
let have = 0;
let miss = 0;
for (let i = 0; i < list.length; i += 4) {
  const batch = list.slice(i, i + 4);
  const out = await Promise.all(batch.map((row) => one(row).catch(() => "miss" as const)));
  for (const s of out) {
    if (s === "ok") ok++;
    else if (s === "have") have++;
    else miss++;
  }
}
console.log(`[logos] communities ${list.length} new ${ok} already ${have} missed ${miss}`);
