import type { DayKey, TimeSlot, WeekHours } from "./hours.ts";
import { DAYS } from "./hours.ts";
import type { PayKey } from "./pays.ts";
import { keyFromUrl, type SocialKey, type SocialLink } from "./socials.ts";

const OSM: Record<string, DayKey> = {
  mo: "lun",
  tu: "mar",
  we: "mie",
  th: "jue",
  fr: "vie",
  sa: "sab",
  su: "dom",
};

const ORDER: DayKey[] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

export type ShopFacts = {
  address?: string;
  phone?: string;
  hours?: WeekHours;
  hoursText?: string;
  links?: SocialLink[];
  pays?: PayKey[];
};

function closedWeek(): WeekHours {
  return {
    lun: { closed: true },
    mar: { closed: true },
    mie: { closed: true },
    jue: { closed: true },
    vie: { closed: true },
    sab: { closed: true },
    dom: { closed: true },
  };
}

function span(a: string, b?: string): DayKey[] | null {
  const from = OSM[a.toLowerCase()];
  if (!from) return null;
  if (!b) return [from];
  const to = OSM[b.toLowerCase()];
  if (!to) return null;
  const i = ORDER.indexOf(from);
  const j = ORDER.indexOf(to);
  if (i < 0 || j < 0) return null;
  const out: DayKey[] = [];
  let k = i;
  for (let n = 0; n < 7; n++) {
    out.push(ORDER[k]!);
    if (k === j) return out;
    k = (k + 1) % 7;
  }
  return null;
}

function hm(raw: string): string | null {
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h === 24 && min === 0) return "23:59";
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

/** Horario OSM simple (Mo-Fr 09:00-18:00). Si no se entiende, queda el texto. */
export function parseOpeningHours(raw: string): WeekHours | null {
  const text = raw.trim();
  if (!text) return null;
  if (/^24\/7$/.test(text)) {
    const slot = { open: "00:00", close: "23:59" };
    const week = closedWeek();
    for (const d of DAYS) week[d.key] = { slots: [slot] };
    return week;
  }
  if (/[()]|PH|SH|sunrise|sunset|week|off|holiday/i.test(text)) return null;
  const week = closedWeek();
  for (const rule of text.split(";")) {
    const part = rule.trim();
    if (!part) continue;
    const m = part.match(/^([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(.+)$/);
    if (!m) return null;
    const days = span(m[1]!, m[2]);
    if (!days?.length) return null;
    const slots: TimeSlot[] = [];
    for (const bit of m[3]!.split(",")) {
      const pair = bit.trim().match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
      if (!pair) return null;
      const open = hm(pair[1]!);
      const close = hm(pair[2]!);
      if (!open || !close) return null;
      slots.push({ open, close });
    }
    if (!slots.length || slots.length > 2) return null;
    for (const day of days) week[day] = { slots };
  }
  return week;
}

function httpUrl(raw: string) {
  const t = raw.trim();
  if (!t || /^javascript:/i.test(t)) return "";
  const withProto = /^https?:\/\//i.test(t) ? t : t.includes(".") ? `https://${t}` : "";
  if (!withProto) return "";
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
}

function pushLink(rows: SocialLink[], seen: Set<string>, key: SocialKey, raw: string) {
  const url = key === "whatsapp" ? wa(raw) : httpUrl(raw);
  if (!url || seen.has(url)) return;
  seen.add(url);
  rows.push({ key, label: key, url });
}

function wa(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return "";
  return `https://wa.me/${digits}`;
}

function addressOf(tags: Record<string, string>) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ").trim();
  const city = [tags["addr:city"], tags["addr:state"], tags["addr:country"]].filter(Boolean).join(", ");
  return [street, city].filter(Boolean).join(", ");
}

/** Lo que BTC Map guarda en las etiquetas OSM del comercio. */
export function factsFromOsmTags(tags: Record<string, string> | undefined): ShopFacts {
  const t = tags || {};
  const address = addressOf(t);
  const phone = (t.phone || t["contact:phone"] || t["contact:mobile"] || "").trim();
  const hoursText = (t.opening_hours || "").trim();
  const hours = hoursText ? parseOpeningHours(hoursText) || undefined : undefined;
  const rows: SocialLink[] = [];
  const seen = new Set<string>();
  pushLink(rows, seen, "web", t.website || t["contact:website"] || "");
  pushLink(rows, seen, "instagram", t["contact:instagram"] || "");
  pushLink(rows, seen, "facebook", t["contact:facebook"] || "");
  pushLink(rows, seen, "x", t["contact:twitter"] || "");
  pushLink(rows, seen, "telegram", t["contact:telegram"] || "");
  pushLink(rows, seen, "youtube", t["contact:youtube"] || "");
  pushLink(rows, seen, "whatsapp", t["contact:whatsapp"] || "");
  const pays: PayKey[] = [];
  if (/^yes$/i.test(t["payment:onchain"] || "") || /^yes$/i.test(t["payment:bitcoin"] || "")) pays.push("onchain");
  if (/^yes$/i.test(t["payment:lightning"] || "")) pays.push("lightning");
  return {
    address: address || undefined,
    phone: phone || undefined,
    hours,
    hoursText: hours ? undefined : hoursText || undefined,
    links: rows.length ? rows : undefined,
    pays: pays.length ? pays : undefined,
  };
}

export function linkKey(url: string, key?: string): SocialKey {
  if (key && key !== "web") return key as SocialKey;
  return keyFromUrl(url);
}
