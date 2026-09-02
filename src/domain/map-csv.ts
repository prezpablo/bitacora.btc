import type { Community, MerchantLocal, MerchantPlace } from "./entities";
import { DAYS, EMPTY_HOURS, daySlots, type DayKey, type TimeSlot, type WeekHours } from "./hours";
import { PAY_KEYS, type PayKey } from "./pays";
import { SOCIAL_KEYS, type SocialKey, type SocialLink, urlFor } from "./socials";

export const MAP_CSV_HEADERS = [
  "id",
  "tipo",
  "name",
  "lat",
  "lon",
  "address",
  "description",
  "notes",
  "score",
  "votes",
  "logo",
  "socials",
  "hours",
  "pays",
  "created",
  "token",
  "verifiedAt",
] as const;

export type MapTipo = "shop" | "community";

export type MapCsvRow = {
  id: string;
  tipo: MapTipo;
  name: string;
  lat: number;
  lon: number;
  address: string;
  description: string;
  notes: string;
  score: number;
  votes: number;
  logo: string;
  socials: string;
  hours: string;
  pays: string;
  created: number;
  token: string;
  verifiedAt: number;
};

const DAY_RE = /(lun|mar|mie|jue|vie|sab|dom)/g;

export function addScore(score: number, votes: number, stars: number) {
  const n = Math.max(0, Math.floor(votes) || 0);
  const prev = n === 0 ? 0 : Number(score) || 0;
  const next = n + 1;
  return { score: (prev * n + stars) / next, votes: next };
}

function pad4(t: string) {
  const clean = t.replace(/\D/g, "").padStart(4, "0").slice(0, 4);
  if (!clean || clean === "0000") return "0000";
  const hh = Math.min(23, Number(clean.slice(0, 2)) || 0);
  const mm = Math.min(59, Number(clean.slice(2, 4)) || 0);
  return `${String(hh).padStart(2, "0")}${String(mm).padStart(2, "0")}`;
}

function fromHm(raw: string) {
  const d = pad4(raw);
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

function slotDigits(slot?: TimeSlot) {
  if (!slot) return "00000000";
  const o = pad4((slot.open || "00:00").replace(":", ""));
  const c = pad4((slot.close || "00:00").replace(":", ""));
  if (o === "0000" && c === "0000") return "00000000";
  return `${o}${c}`;
}

/** lun0800120014001900mar0900180000000000… empty slots → 0. */
export function hoursToCsv(hours?: WeekHours): string {
  const src = hours || EMPTY_HOURS;
  return DAYS.map((d) => {
    const slots = daySlots(src[d.key]).slice(0, 2);
    return `${d.key}${slotDigits(slots[0])}${slotDigits(slots[1])}`;
  }).join("");
}

export function hoursFromCsv(raw: string): WeekHours {
  const out: WeekHours = {
    lun: { closed: true },
    mar: { closed: true },
    mie: { closed: true },
    jue: { closed: true },
    vie: { closed: true },
    sab: { closed: true },
    dom: { closed: true },
  };
  const text = (raw || "").replace(/\s+/g, "");
  const keys = [...text.matchAll(DAY_RE)];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]![1] as DayKey;
    const from = (keys[i]!.index || 0) + key.length;
    const to = i + 1 < keys.length ? keys[i + 1]!.index! : text.length;
    const digits = `${text.slice(from, to).replace(/\D/g, "")}0000000000000000`.slice(0, 16);
    const slots: TimeSlot[] = [];
    for (let s = 0; s < 16; s += 8) {
      const block = digits.slice(s, s + 8);
      if (block === "00000000") continue;
      slots.push({ open: fromHm(block.slice(0, 4)), close: fromHm(block.slice(4, 8)) });
    }
    out[key] = slots.length ? { slots } : { closed: true };
  }
  return out;
}

export function socialsToCsv(links?: SocialLink[]): string {
  return (links || [])
    .map((l) => {
      const handle = (l.url || "").replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
      const short = l.url.includes(l.key) || l.url.startsWith("http") ? l.url : `@${handle}`;
      return `${l.key}:${short}`;
    })
    .join(" | ");
}

export function socialsFromCsv(raw: string): SocialLink[] {
  if (!raw.trim()) return [];
  const out: SocialLink[] = [];
  for (const part of raw.split("|")) {
    const bit = part.trim();
    if (!bit) continue;
    const cut = bit.indexOf(":");
    const key = (cut >= 0 ? bit.slice(0, cut) : "web").trim() as SocialKey;
    const val = (cut >= 0 ? bit.slice(cut + 1) : bit).trim();
    if (!SOCIAL_KEYS.includes(key) || !val) continue;
    const url = urlFor(key, val);
    if (url) out.push({ key, label: key, url });
  }
  return out;
}

export function paysToCsv(pays?: PayKey[]): string {
  return (pays || []).filter((p) => PAY_KEYS.includes(p)).join("|");
}

export function paysFromCsv(raw: string): PayKey[] {
  return raw
    .split("|")
    .map((p) => p.trim())
    .filter((p): p is PayKey => PAY_KEYS.includes(p as PayKey));
}

export function logoUrl(raw: string) {
  const t = String(raw || "").trim();
  if (!t) return "";
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml)/i.test(t) && t.length < 400_000) return t;
  if (t.startsWith("data:") || /^javascript:/i.test(t)) return "";
  if (t.startsWith("/") && !t.startsWith("//") && /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(t)) return t;
  try {
    const href = t.startsWith("//") ? `https:${t}` : /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const u = new URL(href);
    if (u.protocol === "http:") u.protocol = "https:";
    if (u.protocol !== "https:") return "";
    if (u.hostname === "btcmap.org" && u.pathname.includes("netlify/images")) {
      const inner = u.searchParams.get("url");
      if (inner) return logoUrl(inner);
    }
    return u.toString();
  } catch {
    return "";
  }
}

/** Direct HTTPS: CSP ya permite `img-src https:`. `/logo` solo si el VPS tiene la ruta. */
export function imgSrc(raw: string) {
  const u = logoUrl(raw);
  if (!u) return "";
  if (u.startsWith("/") || u.startsWith("data:")) return u;
  return u;
}

function cell(v: string | number) {
  let s = String(v ?? "").replace(/\r?\n/g, " ").trim();
  if (/^[=+\-@|]/.test(s) || s.startsWith("\t")) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function stringifyMapCsv(rows: MapCsvRow[]): string {
  const body = rows.map((r) =>
    [
      r.id,
      r.tipo,
      r.name,
      r.lat,
      r.lon,
      r.address,
      r.description,
      r.notes,
      r.score.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""),
      r.votes,
      r.logo,
      r.socials,
      r.hours,
      r.pays,
      r.created,
      r.token,
      r.verifiedAt || "",
    ]
      .map(cell)
      .join(","),
  );
  return [MAP_CSV_HEADERS.join(","), ...body].join("\n") + "\n";
}

/** Snapshot GitHub / GET público: sin códigos CARGA. SQLite sí los guarda. */
export function stringifyMapCsvPublic(rows: MapCsvRow[]): string {
  return stringifyMapCsv(rows.map((r) => ({ ...r, token: "" })));
}

export function parseMapCsv(text: string): MapCsvRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const head = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => head.indexOf(name);
  const rows: MapCsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const get = (name: string) => (idx(name) >= 0 ? cols[idx(name)] || "" : "").trim();
    const id = get("id");
    if (!id) continue;
    const tipoRaw = get("tipo");
    const tipo = tipoRaw === "community" || tipoRaw === "comunidad" ? "community" : tipoRaw === "shop" || tipoRaw === "comercio" ? "shop" : null;
    if (!tipo) continue;
    const lat = Number(get("lat"));
    const lon = Number(get("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    rows.push({
      id,
      tipo,
      name: get("name"),
      lat,
      lon,
      address: get("address"),
      description: get("description"),
      notes: get("notes"),
      score: Number(get("score")) || 0,
      votes: Math.max(0, Math.floor(Number(get("votes")) || 0)),
      logo: logoUrl(get("logo")),
      socials: get("socials"),
      hours: get("hours").replace(/\s+/g, ""),
      pays: get("pays"),
      created: Number(get("created")) || Date.now(),
      token: get("token"),
      verifiedAt: Number(get("verifiedat") || get("verifiedAt")) || 0,
    });
  }
  return rows;
}

export function shopToRow(id: string, place: Partial<MerchantPlace>, local: MerchantLocal): MapCsvRow {
  return {
    id,
    tipo: "shop",
    name: local.name || place.name || id,
    lat: local.lat ?? place.lat ?? 0,
    lon: local.lon ?? place.lon ?? 0,
    address: local.address || "",
    description: local.description || "",
    notes: local.notes || "",
    score: local.score ?? 0,
    votes: local.voteCount ?? local.votes?.length ?? 0,
    logo: logoUrl(local.logo || ""),
    socials: socialsToCsv(local.links),
    hours: hoursToCsv(local.hours),
    pays: paysToCsv(local.pays),
    created: local.listedAt || place.createdAt || Date.now(),
    token: local.verifyToken || "",
    verifiedAt: local.verifiedAt || 0,
  };
}

export function communityToRow(c: Community): MapCsvRow {
  return {
    id: c.id,
    tipo: "community",
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    address: "",
    description: c.description || "",
    notes: "",
    score: c.score ?? 0,
    votes: c.voteCount ?? c.votes?.length ?? 0,
    logo: logoUrl(c.logo || ""),
    socials: socialsToCsv(c.links as SocialLink[]),
    hours: "",
    pays: "",
    created: c.createdAt,
    token: c.verifyToken || "",
    verifiedAt: c.verifiedAt || 0,
  };
}

export function rowToLocal(row: MapCsvRow): MerchantLocal {
  const votes = row.votes;
  const score = row.score;
  return {
    description: row.description,
    notes: row.notes || undefined,
    votes: [],
    listedAt: row.created,
    score,
    voteCount: votes,
    hours: row.hours ? hoursFromCsv(row.hours) : undefined,
    pays: paysFromCsv(row.pays),
    links: socialsFromCsv(row.socials),
    address: row.address || undefined,
    logo: row.logo || undefined,
    lat: row.lat,
    lon: row.lon,
    name: row.name,
    category: "propuesta",
    updatedAt: Date.now(),
    verifyToken: row.token || undefined,
    verifiedAt: row.verifiedAt || undefined,
  };
}

export function rowToCommunity(row: MapCsvRow): Community {
  return {
    id: row.id,
    slug: row.id.replace(/^c:/, ""),
    name: row.name,
    lat: row.lat,
    lon: row.lon,
    logo: row.logo,
    description: row.description,
    links: socialsFromCsv(row.socials),
    createdAt: row.created,
    score: row.score,
    voteCount: row.votes,
    verifyToken: row.token || undefined,
    verifiedAt: row.verifiedAt || undefined,
  };
}

export function dumpMapCsv(
  store: Record<string, MerchantLocal>,
  comms: Community[],
  places: MerchantPlace[] = [],
) {
  const byId = new Map(places.map((p) => [p.id, p]));
  const shops = Object.entries(store)
    .filter(([, s]) => !s.removed)
    .map(([id, s]) => shopToRow(id, byId.get(id) || {}, s));
  const communities = comms.map(communityToRow);
  return stringifyMapCsv([...shops, ...communities]);
}

/** Incoming wins, but empty text does not erase a field that already had data. */
export function mergeMapRows(base: MapCsvRow[], incoming: MapCsvRow[]) {
  const map = new Map(base.map((r) => [r.id, r]));
  for (const r of incoming) {
    const prev = map.get(r.id);
    if (!prev) {
      map.set(r.id, r);
      continue;
    }
    const next: MapCsvRow = { ...prev, ...r };
    if (!next.logo) next.logo = prev.logo;
    if (!next.description) next.description = prev.description;
    if (!next.notes) next.notes = prev.notes;
    if (!next.socials) next.socials = prev.socials;
    if (!next.hours) next.hours = prev.hours;
    if (!next.pays) next.pays = prev.pays;
    if (!next.address) next.address = prev.address;
    if (!next.name) next.name = prev.name;
    if (!next.token) next.token = prev.token;
    if ((prev.verifiedAt || 0) > (next.verifiedAt || 0)) next.verifiedAt = prev.verifiedAt;
    if ((prev.votes || 0) > (next.votes || 0)) {
      next.score = prev.score;
      next.votes = prev.votes;
    }
    map.set(r.id, next);
  }
  return [...map.values()];
}

const NEW_ID =
  /^(c:[a-z0-9][a-z0-9-]{1,62}|local:-?\d{1,3}\.\d{1,8},-?\d{1,3}\.\d{1,8}|btcmap:\d+|node:\d+|osm:[a-z]+:\d+)$/i;

function finiteCoord(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -85 && lat <= 85 && lon >= -180 && lon <= 180 && !(lat === 0 && lon === 0);
}

function sanitizeNewRow(r: MapCsvRow): MapCsvRow | null {
  const id = String(r.id || "").trim();
  if (!NEW_ID.test(id)) return null;
  const name = String(r.name || "").trim().slice(0, 80);
  if (name.length < 2) return null;
  if (!finiteCoord(r.lat, r.lon)) return null;
  const tipo: MapTipo = id.startsWith("c:") ? "community" : "shop";
  const votes = r.votes === 1 ? 1 : 0;
  const score = votes ? Math.min(5, Math.max(1, Number(r.score) || 1)) : 0;
  return {
    ...r,
    id,
    tipo,
    name,
    lat: r.lat,
    lon: r.lon,
    address: String(r.address || "").slice(0, 200),
    description: String(r.description || "").slice(0, 400),
    notes: String(r.notes || "").slice(0, 240),
    score,
    votes,
    logo: String(r.logo || "").slice(0, 500),
    socials: String(r.socials || "").slice(0, 800),
    hours: String(r.hours || "").replace(/\s+/g, "").slice(0, 200),
    pays: String(r.pays || "").slice(0, 80),
    created: Date.now(),
    token: String(r.token || "").slice(0, 24),
    verifiedAt: 0,
  };
}

/** POST público: altas nuevas (máx. 2) + un voto por fila; no mueve coords ni borra. */
export function applyPublicMapPatch(current: MapCsvRow[], incoming: MapCsvRow[]): MapCsvRow[] | null {
  const out = current.map((r) => ({ ...r }));
  const byId = new Map(out.map((r) => [r.id, r]));
  let added = 0;
  let voteBumps = 0;
  for (const r of incoming) {
    const prev = byId.get(r.id);
    if (!prev) {
      if (added >= 2) continue;
      const row = sanitizeNewRow(r);
      if (!row) continue;
      added += 1;
      out.push(row);
      byId.set(row.id, row);
      continue;
    }
    const nextVotes = Math.max(0, Math.floor(Number(r.votes) || 0));
    if (nextVotes > (prev.votes || 0) + 1) continue;
    if (nextVotes === (prev.votes || 0) + 1) {
      if (voteBumps >= 3) continue;
      voteBumps += 1;
      prev.votes = nextVotes;
      prev.score = Math.min(5, Math.max(1, Number(r.score) || prev.score || 1));
    }
    if (!prev.description && r.description) prev.description = String(r.description).slice(0, 400);
    if (!prev.logo && r.logo) prev.logo = String(r.logo).slice(0, 500);
    if (!prev.socials && r.socials) prev.socials = String(r.socials).slice(0, 800);
    if (!prev.hours && r.hours) prev.hours = String(r.hours).replace(/\s+/g, "").slice(0, 200);
    if (!prev.pays && r.pays) prev.pays = String(r.pays).slice(0, 80);
    if (!prev.address && r.address) prev.address = String(r.address).slice(0, 200);
  }
  return out;
}

