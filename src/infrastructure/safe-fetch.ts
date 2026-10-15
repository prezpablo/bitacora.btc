import https from "node:https";
import type { IncomingMessage } from "node:http";
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
  /(^|\.)nip\.io$|(^|\.)sslip\.io$|(^|\.)localhost$|metadata\.google\.internal$|^bitacora\.org$|^www\.bitacora\.org$|^bitacorabtc\.org$|^www\.bitacorabtc\.org$/i;
const SELF_IP = new Set(["45.158.116.49", "2a0a:3840:8078:116::2d9e:7431:1337"]);

export function isPublicHttp(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
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

type Pin = { address: string; family: 4 | 6 };

/** El socket usa esta IP. No vuelve a preguntar al DNS. */
export function pinnedLookup(address: string, family: 4 | 6) {
  return (
    _hostname: string,
    options: { all?: boolean },
    callback: (err: NodeJS.ErrnoException | null, address: string | { address: string; family: number }[], family?: number) => void,
  ) => {
    if (options?.all) callback(null, [{ address, family }]);
    else callback(null, address, family);
  };
}

async function dnsPin(host: string): Promise<Pin | null> {
  const name = host.replace(/^\[|\]$/g, "");
  if (isIP(name)) {
    if (!ipPublic(name) || SELF_IP.has(name)) return null;
    return { address: name, family: isIP(name) === 6 ? 6 : 4 };
  }
  try {
    const rows = await lookup(name, { all: true, verbatim: true });
    if (!rows.length) return null;
    if (!rows.every((r) => ipPublic(r.address) && !SELF_IP.has(r.address))) return null;
    const first = rows[0]!;
    return { address: first.address, family: first.family === 6 ? 6 : 4 };
  } catch {
    return null;
  }
}

export async function urlResolvesPublic(raw: string) {
  if (!isPublicHttp(raw)) return false;
  let host = "";
  try {
    host = new URL(raw).hostname;
  } catch {
    return false;
  }
  return (await dnsPin(host)) !== null;
}

function header(res: IncomingMessage, name: string) {
  const raw = res.headers[name];
  return (Array.isArray(raw) ? raw[0] : raw || "").trim();
}

function readCapped(res: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    res.on("data", (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8").slice(0, 200_000)));
    res.on("error", reject);
  });
}

function getPinned(url: string, pin: Pin) {
  const u = new URL(url);
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const signal = AbortSignal.timeout(5000);
  return new Promise<{ status: number; location: string; type: string; body: string }>((resolve, reject) => {
    const req = https.request(
      {
        protocol: "https:",
        hostname: host,
        port: u.port || 443,
        path: `${u.pathname}${u.search}` || "/",
        method: "GET",
        servername: host,
        headers: {
          Accept: "text/html,application/json,text/plain,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": UA,
          "Accept-Language": "es,en;q=0.8",
        },
        lookup: pinnedLookup(pin.address, pin.family),
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = header(res, "location");
        const type = header(res, "content-type").toLowerCase();
        if (status >= 300 && status < 400) {
          res.resume();
          resolve({ status, location, type, body: "" });
          return;
        }
        if (status < 200 || status >= 300) {
          res.resume();
          resolve({ status, location, type, body: "" });
          return;
        }
        readCapped(res).then(
          (body) => resolve({ status, location, type, body }),
          reject,
        );
      },
    );
    const stop = () => req.destroy();
    signal.addEventListener("abort", stop, { once: true });
    req.on("error", reject);
    req.on("close", () => signal.removeEventListener("abort", stop));
    req.end();
  });
}

export async function fetchPublic(url: string, hops = 0): Promise<string> {
  if (hops > 2 || !isPublicHttp(url)) return "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return "";
  }
  const pin = await dnsPin(host);
  if (!pin) return "";
  try {
    const res = await getPinned(url, pin);
    if (res.status >= 300 && res.status < 400) {
      if (!res.location) return "";
      const next = new URL(res.location, url).toString();
      return fetchPublic(next, hops + 1);
    }
    if (res.status < 200 || res.status >= 300) return "";
    if (res.type && !/text|json|xml|html|markdown|javascript/i.test(res.type)) return "";
    return res.body.slice(0, 200_000);
  } catch {
    return "";
  }
}
