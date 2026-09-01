import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const UA =
  "Mozilla/5.0 (compatible; bitacora.btc/1.0; +https://github.com/prezpablo/bitacora.btc) AppleWebKit/537.36";

function ipv4Public(ip: string) {
  const p = ip.split(".").map((n) => Number(n));
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 192 && b === 168) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a >= 224) return false;
  return true;
}

function ipv6Public(ip: string) {
  const s = ip.toLowerCase();
  if (s === "::1" || s === "::") return false;
  if (s.startsWith("fe80:") || s.startsWith("fc") || s.startsWith("fd")) return false;
  const m = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (m) return ipv4Public(m[1]!);
  if (s.startsWith("2001:db8:") || s.startsWith("2001:2:")) return false;
  return true;
}

export function ipPublic(ip: string) {
  const v = isIP(ip);
  if (v === 4) return ipv4Public(ip);
  if (v === 6) return ipv6Public(ip);
  return false;
}

const SELF_HOST =
  /(^|\.)nip\.io$|(^|\.)sslip\.io$|(^|\.)localhost$|metadata\.google\.internal$|^bitacorabtc\.org$|^www\.bitacorabtc\.org$/i;
const SELF_IP = new Set(["45.158.116.49", "2a0a:3840:8078:116::2d9e:7431:1337"]);

export function isPublicHttp(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (u.username || u.password) return false;
    const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
      return false;
    }
    if (host === "::1" || host.endsWith(".onion")) return false;
    if (SELF_HOST.test(host)) return false;
    if (SELF_IP.has(host)) return false;
    if (isIP(host) && !ipPublic(host)) return false;
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

async function dnsPublic(host: string) {
  if (isIP(host)) return ipPublic(host);
  try {
    const rows = await lookup(host, { all: true, verbatim: true });
    if (!rows.length) return false;
    return rows.every((r) => ipPublic(r.address) && !SELF_IP.has(r.address));
  } catch {
    return false;
  }
}

export async function fetchPublic(url: string, hops = 0): Promise<string> {
  if (hops > 3 || !isPublicHttp(url)) return "";
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return "";
  }
  if (!(await dnsPublic(host))) return "";
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(7000),
      headers: {
        Accept: "text/html,application/json,text/plain,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": UA,
        "Accept-Language": "es,en;q=0.8",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return "";
      const next = new URL(loc, url).toString();
      return fetchPublic(next, hops + 1);
    }
    if (!res.ok) return "";
    const ctype = (res.headers.get("content-type") || "").toLowerCase();
    if (ctype && !/text|json|xml|html|markdown|javascript/i.test(ctype)) return "";
    return (await res.text()).slice(0, 200_000);
  } catch {
    return "";
  }
}
