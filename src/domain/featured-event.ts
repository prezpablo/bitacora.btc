import {
  FEATURED_EVENTS,
  type FeaturedEvent,
  type LangText,
} from "../content/featured-events.ts";

export type { FeaturedCredit, FeaturedEvent, FeaturedImage, FeaturedLinks, LangText } from "../content/featured-events.ts";
export { FEATURED_EVENTS } from "../content/featured-events.ts";

export type AppLang = "es" | "en" | "pt";

const OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/;
const HTTPS = /^https:\/\/\S+$/;
const TRACKING = /(?:^|[?&])(utm_[^=&#]*|fbclid|gclid|gclsrc|dclid|mc_eid|mc_cid|igshid|vero_id|_hsenc|_hsmi|mkt_tok)=/i;

export type FeaturedLinkKind = "event" | "tickets" | "agenda";

export type FeaturedLink = {
  kind: FeaturedLinkKind;
  href: string;
};

/** Instante absoluto. Rechaza una fecha sin zona: el servidor no decide la hora. */
export function featuredEndMs(iso: string): number | null {
  if (!OFFSET.test(iso)) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/** El que cierra antes, mientras `now` sea anterior a `endsAt`. En el instante de cierre, ya no. */
export function pickFeatured(
  now: Date | number | string = new Date(),
  events: readonly FeaturedEvent[] = FEATURED_EVENTS,
): FeaturedEvent | null {
  const ms = typeof now === "number" ? now : now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(ms)) return null;
  let next: FeaturedEvent | null = null;
  let nextEnd = Infinity;
  for (const event of events) {
    const end = featuredEndMs(event.endsAt);
    if (end == null || ms >= end || end >= nextEnd) continue;
    next = event;
    nextEnd = end;
  }
  return next;
}

const LINK_ORDER: readonly FeaturedLinkKind[] = ["event", "tickets", "agenda"];

/** https limpio, o vacío. Rechaza seguimiento, usuario en la URL y esquemas que no sean https. */
export function featuredHref(raw: string | undefined): string {
  const href = raw?.trim() ?? "";
  if (!HTTPS.test(href) || TRACKING.test(href)) return "";
  try {
    const url = new URL(href);
    if (url.username || url.password || url.protocol !== "https:") return "";
  } catch {
    return "";
  }
  return href;
}

/** Ruta de este sitio. Un https externo no se usa: el navegador no pide el archivo a un tercero. */
export function siteAsset(raw: string | undefined): string {
  const value = raw?.trim() ?? "";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://") || value.includes("\\")) return "";
  return value;
}

/** Solo https, en orden Página / Entradas / Agenda. Una URL repetida no se pinta dos veces. */
export function featuredLinks(event: FeaturedEvent): FeaturedLink[] {
  const out: FeaturedLink[] = [];
  const seen = new Set<string>();
  for (const kind of LINK_ORDER) {
    const href = featuredHref(event.links?.[kind]);
    if (!href || seen.has(href)) continue;
    seen.add(href);
    out.push({ kind, href });
  }
  return out;
}

export function featuredText(text: LangText | undefined, lang: AppLang): string {
  if (!text) return "";
  const value = text[lang]?.trim() || text.es.trim();
  return value;
}

const WEEKDAY: Record<AppLang, readonly string[]> = {
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  pt: ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"],
};

const MONTH: Record<AppLang, readonly string[]> = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
};

/** Fecha y hora tal como están escritas en el ISO, con su zona. No usa el reloj del servidor ni Intl. */
export function formatFeaturedWhen(iso: string, lang: AppLang): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match || !OFFSET.test(iso)) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  const weekday = WEEKDAY[lang][new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
  const monthName = MONTH[lang][month - 1] ?? "";
  const hm = `${match[4]}:${match[5]}`;
  if (lang === "en") return `${weekday} ${day} ${monthName} ${year}, ${hm}`;
  return `${weekday} ${day} de ${monthName} de ${year}, ${hm}`;
}
