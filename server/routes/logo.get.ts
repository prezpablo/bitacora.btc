import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineEventHandler, getQuery, setHeader, setResponseStatus } from "h3";
import { isPublicHttp, urlResolvesPublic } from "../../src/infrastructure/safe-fetch";

const DIR = join(process.cwd(), "data", "logo-cache");
const MAX = 2_000_000;

const logoHits = new Map<string, number[]>();

function logoLimited(ip: string) {
  const now = Date.now();
  const windowMs = 10 * 60_000;
  const arr = (logoHits.get(ip) || []).filter((t) => now - t < windowMs);
  const all = [...logoHits.values()].reduce((n, a) => n + a.filter((t) => now - t < windowMs).length, 0);
  if (arr.length >= 240 || all >= 1200) return true;
  arr.push(now);
  logoHits.set(ip, arr);
  if (logoHits.size > 4000) {
    for (const [k, v] of logoHits) {
      const keep = v.filter((t) => now - t < windowMs);
      if (!keep.length) logoHits.delete(k);
      else logoHits.set(k, keep);
    }
  }
  return false;
}

async function toThumb(buf: Buffer) {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(buf)
      .rotate()
      .resize(960, 720, { fit: "cover", position: "centre" })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
  } catch {
    return null;
  }
}

function lumaCompact(href: string) {
  try {
    const u = new URL(href);
    if (u.hostname !== "images.lumacdn.com") return href;
    if (u.pathname.includes("/cdn-cgi/image/")) return href;
    const path = u.pathname.replace(/^\//, "");
    if (!path) return href;
    return `https://images.lumacdn.com/cdn-cgi/image/width=960,height=720,fit=cover,gravity=center,quality=72,format=jpeg/${path}`;
  } catch {
    return href;
  }
}

function unwrap(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return "";
    if (u.hostname === "btcmap.org" && u.pathname.includes("netlify/images")) {
      const inner = u.searchParams.get("url");
      if (inner) return unwrap(inner);
    }
    if (u.hostname === "img.evbuc.com") {
      const inner = u.pathname.replace(/^\//, "");
      if (inner.startsWith("https://")) return unwrap(inner);
    }
    if (!isPublicHttp(u.toString())) return "";
    return u.toString();
  } catch {
    return "";
  }
}

export default defineEventHandler(async (event) => {
  const ip = String(event.node?.req?.headers?.["x-real-ip"] || event.node?.req?.socket?.remoteAddress || "anon");
  const q = getQuery(event);
  const rawHref = unwrap(String(q.u || ""));
  const href = lumaCompact(rawHref);
  if (!href || !(await urlResolvesPublic(href))) {
    setResponseStatus(event, 404);
    return "";
  }
  const thumb = String(q.fit || "") === "thumb";
  const id = createHash("sha256").update(`${thumb ? "t1:" : ""}${href}`).digest("hex").slice(0, 32);
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
  if (logoLimited(ip)) {
    setResponseStatus(event, 429);
    return "";
  }

  async function pull(url: string) {
    const res = await fetch(url, {
      headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": "Mozilla/5.0 Bitacora.btc" },
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
    });
    let final = res;
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      const next = loc ? unwrap(new URL(loc, url).toString()) : "";
      if (!next) return null;
      final = await fetch(next, {
        headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": "Mozilla/5.0 Bitacora.btc" },
        signal: AbortSignal.timeout(10_000),
        redirect: "manual",
      });
    }
    if (!final.ok) return null;
    const type = (final.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (!/^image\//i.test(type) && type !== "application/octet-stream") return null;
    const buf = Buffer.from(await final.arrayBuffer());
    if (!buf.length || buf.length > MAX) return null;
    return { buf, type };
  }

  try {
    let got = await pull(href);
    if (!got && rawHref && rawHref !== href) got = await pull(rawHref);
    if (!got) {
      setResponseStatus(event, 404);
      return "";
    }
    let out: Buffer = got.buf;
    let outType = got.type.startsWith("image/") ? got.type : "image/jpeg";
    if (thumb) {
      const cut = await toThumb(got.buf);
      if (cut?.length) {
        out = cut;
        outType = "image/jpeg";
      }
    }
    try {
      mkdirSync(DIR, { recursive: true });
      writeFileSync(file, out);
      writeFileSync(meta, outType);
    } catch {
      /* disk optional */
    }
    setHeader(event, "content-type", outType);
    setHeader(event, "cache-control", "public, max-age=604800, immutable");
    return out;
  } catch {
    setResponseStatus(event, 404);
    return "";
  }
});
