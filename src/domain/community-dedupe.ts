export type NamedPin = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  logo?: string;
  slug?: string;
};

function foldName(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/consciencia/g, "conciencia")
    .replace(/escuela|colegio/g, "school")
    .replace(/comunidad/g, "community")
    .replace(/bitcoins?/g, "btc")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|de|del|la|el|los|las|y|and|of|do|da|en)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function logoKey(raw?: string) {
  const t = (raw || "").trim();
  if (!t || t.startsWith("data:")) return "";
  try {
    const u = new URL(t.startsWith("/") ? `https://local.invalid${t}` : /^https?:\/\//i.test(t) ? t : `https://${t}`);
    return `${u.pathname.replace(/\/+$/, "").toLowerCase()}|${u.hostname.replace(/^www\./, "")}`;
  } catch {
    return t.split("?")[0].toLowerCase();
  }
}

function km(a: NamedPin, b: NamedPin) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

function tokens(s: string) {
  return new Set(foldName(s).split(" ").filter((w) => w.length > 1));
}

function nameHit(a: string, b: string) {
  const fa = foldName(a);
  const fb = foldName(b);
  if (!fa || !fb) return false;
  if (fa === fb) return true;
  if (fa.includes(fb) || fb.includes(fa)) return Math.min(fa.length, fb.length) >= 6;
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return false;
  let n = 0;
  for (const w of ta) if (tb.has(w)) n++;
  return n / Math.min(ta.size, tb.size) >= 0.66 && n >= 2;
}

function sameCommunity(a: NamedPin, b: NamedPin) {
  if (a.id && b.id && a.id === b.id) return true;
  if (a.slug && b.slug && a.slug === b.slug) return true;
  const near = km(a, b) < 28;
  if (!near) return false;
  const la = logoKey(a.logo);
  const lb = logoKey(b.logo);
  if (la && lb && la === lb) return true;
  return nameHit(a.name, b.name);
}

function rank(p: NamedPin) {
  let n = 0;
  if (p.id.startsWith("c:")) n += 8;
  if (p.logo) n += 3;
  n += Math.min(4, (p.name || "").length / 12);
  return n;
}

export function dedupeCommunities<T extends NamedPin>(rows: T[]): T[] {
  const kept: T[] = [];
  for (const row of rows) {
    if (!row?.id || !Number.isFinite(row.lat) || !Number.isFinite(row.lon)) continue;
    const i = kept.findIndex((k) => sameCommunity(k, row));
    if (i < 0) {
      kept.push(row);
      continue;
    }
    if (rank(row) > rank(kept[i])) kept[i] = row;
  }
  return kept;
}

export function spreadSameCity<T extends NamedPin>(rows: T[], cellDeg = 0.14): (T & { slot: number; slots: number })[] {
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    const k = `${Math.round(r.lat / cellDeg)}_${Math.round(r.lon / cellDeg)}`;
    const g = groups.get(k) || [];
    g.push(r);
    groups.set(k, g);
  }
  const out: (T & { slot: number; slots: number })[] = [];
  for (const g of groups.values()) {
    g.sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));
    g.forEach((r, i) => out.push({ ...r, slot: i, slots: g.length }));
  }
  return out;
}

export function slotShift(slot: number, slots: number) {
  if (slots <= 1) return 0;
  return (slot - (slots - 1) / 2) * 100;
}

/** Offset longitude so logos sit in a row. Keeps lat0/lon0 for clicks. */
export function fanLon<T extends { lat: number; lon: number; slot: number; slots: number }>(
  rows: T[],
  gapDeg: number,
): (T & { lat0: number; lon0: number })[] {
  return rows.map((r) => {
    const dx = r.slots <= 1 ? 0 : (r.slot - (r.slots - 1) / 2) * gapDeg;
    return { ...r, lat0: r.lat, lon0: r.lon, lon: r.lon + dx };
  });
}
