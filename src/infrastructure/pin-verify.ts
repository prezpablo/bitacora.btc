import type { CommunityPin } from "../domain/community-pins.ts";
import { PIN_TTL_MS } from "../domain/community-pins.ts";
import { fetchPublic, isPublicHttp } from "./safe-fetch.ts";

const TOKEN_RE = /^(CARGA|BIT)-[A-Z0-9]{6}$/;

function decode(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function hayToken(blob: string, code: string) {
  const up = blob.toUpperCase();
  if (up.includes(code)) return true;
  const compact = code.replace("-", "");
  return up.replace(/[\s_\-]/g, "").includes(compact);
}

/** Mirrors that actually return HTML/JSON when the silo blocks bots.
 *  FxTwitter: https://github.com/FixTweet/FxTwitter
 *  Jina Reader: https://github.com/jina-ai/reader
 *  njump: https://github.com/fiatjaf/njump */
export function scrapeMirrors(url: string): string[] {
  if (!isPublicHttp(url)) return [];
  let href = url.trim();
  try {
    href = new URL(url).toString();
  } catch {
    return [];
  }
  const u = new URL(href);
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const path = u.pathname;
  const out: string[] = [];
  const push = (x: string) => {
    if (isPublicHttp(x) && !out.includes(x)) out.push(x);
  };

  if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com" || host === "fxtwitter.com") {
    const rest = href.replace(/^https?:\/\/(www\.)?(mobile\.)?(twitter\.com|x\.com|fxtwitter\.com)/i, "");
    push(`https://api.fxtwitter.com${rest}`);
    push(`https://fxtwitter.com${rest}`);
    push(`https://r.jina.ai/https://x.com${rest}`);
    return out;
  }
  if (host === "instagram.com" || host === "instagramez.com" || host === "ddinstagram.com" || host === "kkinstagram.com") {
    const rest = path.replace(/\/+$/, "") || "/";
    const parts = rest.split("/").filter(Boolean);
    const isPost = parts[0] === "p" || parts[0] === "reel" || parts[0] === "reels" || parts[0] === "tv";
    push(`https://www.ddinstagram.com${rest}/`);
    push(`https://www.instagramez.com${rest}/`);
    push(`https://r.jina.ai/https://www.ddinstagram.com${rest}/`);
    if (isPost) {
      const code = parts[1] || "";
      if (code) {
        push(`https://www.instagram.com/${parts[0]}/${code}/embed/captioned/`);
        push(`https://www.ddinstagram.com/${parts[0]}/${code}/`);
      }
    } else {
      const user = parts[0] || "";
      if (user) {
        push(`https://www.ddinstagram.com/${user}/`);
        push(`https://r.jina.ai/https://www.ddinstagram.com/${user}/`);
        push(`https://r.jina.ai/https://ink.bio/${user}`);
      }
    }
    return out.slice(0, 6);
  }
  if (host === "njump.me" || host.endsWith(".njump.me")) {
    push(href);
    push(`https://r.jina.ai/${href}`);
    return out;
  }
  if (path.startsWith("/npub") || /npub1[0-9a-z]+/i.test(href)) {
    const npub = href.match(/npub1[0-9a-z]+/i)?.[0];
    if (npub) {
      push(`https://njump.me/${npub}`);
      push(`https://r.jina.ai/https://njump.me/${npub}`);
    }
  }
  if (host === "t.me" || host === "telegram.me") {
    push(href.endsWith("?embed=1") ? href : `${href}${href.includes("?") ? "&" : "?"}embed=1`);
    push(href);
    push(`https://r.jina.ai/${href}`);
    return out;
  }

  push(href);
  if (!href.endsWith("/")) push(`${href.replace(/\/+$/, "")}/`);
  push(`https://r.jina.ai/${href}`);
  return out.slice(0, 5);
}

export async function scrapeShowsToken(url: string, token: string, extra: string[] = []): Promise<boolean> {
  const code = token.trim().toUpperCase();
  if (!TOKEN_RE.test(code)) return false;
  const seeds = [url, ...extra].filter(Boolean);
  const seen = new Set<string>();
  const targets: string[] = [];
  for (const s of seeds) {
    for (const m of scrapeMirrors(s)) {
      if (seen.has(m)) continue;
      seen.add(m);
      targets.push(m);
    }
  }
  for (const target of targets.slice(0, 8)) {
    const raw = await fetchPublic(target);
    if (!raw) continue;
    if (hayToken(raw, code) || hayToken(decode(raw), code)) return true;
  }
  return false;
}

/** @deprecated alias */
export const urlShowsToken = (url: string, token: string) => scrapeShowsToken(url, token);

export async function scrapePendingPins(rows: CommunityPin[], limit = 4): Promise<{ rows: CommunityPin[]; changed: boolean }> {
  const now = Date.now();
  const pending = rows.filter((p) => !p.verified && now - p.created < PIN_TTL_MS).slice(0, limit);
  if (!pending.length) return { rows, changed: false };
  const hits = await Promise.all(
    pending.map(async (p) => {
      const ok = await scrapeShowsToken(p.proof, p.token, p.links);
      return ok ? p.id : "";
    }),
  );
  const yes = new Set(hits.filter(Boolean));
  if (!yes.size) return { rows, changed: false };
  const next = rows.map((p) => (yes.has(p.id) ? { ...p, verified: true, verifiedAt: now } : p));
  return { rows: next, changed: true };
}
