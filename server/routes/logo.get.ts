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
  if (arr.length >= 80 || all >= 800) return true;
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
  if (logoLimited(ip)) {
    setResponseStatus(event, 429);
    return "";
  }
  const q = getQuery(event);
  const href = lumaCompact(unwrap(String(q.u || "")));
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
  try {
    const res = await fetch(href, {
      headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": "Mozilla/5.0 Bitacora.btc" },
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
    });
    let final = res;
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      const next = loc ? unwrap(new URL(loc, href).toString()) : "";
      if (!next) {
        setResponseStatus(event, 404);
        return "";
      }
      final = await fetch(next, {
        headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": "Mozilla/5.0 Bitacora.btc" },
        signal: AbortSignal.timeout(10_000),
        redirect: "manual",
      });
    }
    if (!final.ok) {
      setResponseStatus(event, 404);
      return "";
    }
    const type = (final.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (!/^image\//i.test(type) && type !== "application/octet-stream") {
      setResponseStatus(event, 404);
      return "";
    }
    const buf = Buffer.from(await final.arrayBuffer());
    if (!buf.length || buf.length > MAX) {
      setResponseStatus(event, 404);
      return "";
    }
    let out: Buffer = buf;
    let outType = type.startsWith("image/") ? type : "image/jpeg";
    if (thumb) {
      const cut = await toThumb(buf);
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
