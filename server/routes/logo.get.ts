import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineEventHandler, getQuery, setHeader, setResponseStatus } from "h3";

const DIR = join(process.cwd(), "data", "logo-cache");
const MAX = 400_000;
const ALLOW = [
  /(^|\.)btcmap\.org$/i,
  /(^|\.)wikimedia\.org$/i,
  /(^|\.)twimg\.com$/i,
  /(^|\.)githubusercontent\.com$/i,
  /(^|\.)ibb\.co$/i,
  /(^|\.)imgur\.com$/i,
  /(^|\.)nostr\.build$/i,
  /(^|\.)meetupstatic\.com$/i,
  /(^|\.)telegram\.org$/i,
  /(^|\.)einundzwanzig\.space$/i,
  /(^|\.)fbcdn\.net$/i,
];

function hostOk(h: string) {
  return ALLOW.some((re) => re.test(h));
}

function unwrap(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return "";
    if (u.hostname === "btcmap.org" && u.pathname.includes("netlify/images")) {
      const inner = u.searchParams.get("url");
      if (inner) return unwrap(inner);
    }
    if (!hostOk(u.hostname)) return "";
    return u.toString();
  } catch {
    return "";
  }
}

export default defineEventHandler(async (event) => {
  const href = unwrap(String(getQuery(event).u || ""));
  if (!href) {
    setResponseStatus(event, 404);
    return "";
  }
  const id = createHash("sha256").update(href).digest("hex").slice(0, 32);
  const file = join(DIR, id);
  const meta = `${file}.type`;
  try {
    if (existsSync(file) && existsSync(meta)) {
      setHeader(event, "content-type", readFileSync(meta, "utf8") || "image/jpeg");
      setHeader(event, "cache-control", "public, max-age=604800, immutable");
      return readFileSync(file);
    }
  } catch {
    /* miss */
  }
  try {
    const res = await fetch(href, {
      headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": "Mozilla/5.0 Bitacora.btc" },
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
    });
    if (!res.ok) {
      setResponseStatus(event, 404);
      return "";
    }
    const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (!/^image\//i.test(type) && type !== "application/octet-stream") {
      setResponseStatus(event, 404);
      return "";
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > MAX) {
      setResponseStatus(event, 404);
      return "";
    }
    try {
      mkdirSync(DIR, { recursive: true });
      writeFileSync(file, buf);
      writeFileSync(meta, type.startsWith("image/") ? type : "image/jpeg");
    } catch {
      /* disk optional */
    }
    setHeader(event, "content-type", type.startsWith("image/") ? type : "image/jpeg");
    setHeader(event, "cache-control", "public, max-age=604800, immutable");
    return buf;
  } catch {
    setResponseStatus(event, 404);
    return "";
  }
});
