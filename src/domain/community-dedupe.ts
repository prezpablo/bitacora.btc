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

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
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
    if (rank(row) > rank(kept[i])) {
      kept[i] = { ...kept[i], ...row, logo: row.logo || kept[i].logo };
    } else {
      kept[i] = { ...row, ...kept[i], logo: kept[i].logo || row.logo };
    }
  }
  return kept;
}

function clusters<T extends NamedPin>(rows: T[], maxKm: number): T[][] {
  const n = rows.length;
  const parent = rows.map((_, i) => i);
  const find = (i: number) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (km(rows[i], rows[j]) < maxKm) {
        const a = find(i);
        const b = find(j);
        if (a !== b) parent[b] = a;
      }
    }
  }
  const map = new Map<number, T[]>();
  rows.forEach((r, i) => {
    const p = find(i);
    const g = map.get(p) || [];
    g.push(r);
    map.set(p, g);
  });
  return [...map.values()];
}

function offsets(n: number, gap: number) {
  const cols = Math.min(n, 5);
  const rows = Math.ceil(n / cols);
  return Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const colsThis = r === rows - 1 ? n - r * cols : cols;
    return {
      dlat: (r - (rows - 1) / 2) * gap,
      dlon: (c - (colsThis - 1) / 2) * gap,
    };
  });
}

export type LaidPin<T> = T & { lat0: number; lon0: number; lng: number; slot: number; slots: number };

/** Same city → logos in a row, each with its own lat/lon. No two share coordinates. */
export function layoutCityLogos<T extends NamedPin>(rows: T[], gapDeg: number): LaidPin<T>[] {
  const gap = Math.max(0.0006, gapDeg);
  const cityKm = Math.max(10, Math.min(48, gap * 111 * 2.4));
  const laid: LaidPin<T>[] = [];
  for (const g of clusters(rows, cityKm)) {
    g.sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));
    const lat0 = g.reduce((s, r) => s + r.lat, 0) / g.length;
    const lon0 = g.reduce((s, r) => s + r.lon, 0) / g.length;
    const pack = offsets(g.length, gap);
    g.forEach((r, i) => {
      const lat = lat0 + pack[i].dlat;
      const lon = lon0 + pack[i].dlon;
      laid.push({
        ...r,
        lat0: r.lat,
        lon0: r.lon,
        lat,
        lon,
        lng: lon,
        slot: i,
        slots: g.length,
      });
    });
  }
  const min = gap * 0.98;
  const placed: LaidPin<T>[] = [];
  for (const r of laid) {
    let lat = r.lat;
    let lon = r.lon;
    let guard = 0;
    const hits = () => placed.some((p) => Math.hypot((p.lat - lat) / 0.9, p.lon - lon) < min);
    while (guard++ < 48 && hits()) lon += gap;
    placed.push({ ...r, lat, lon, lng: lon });
  }
  return placed;
}

/** @deprecated use layoutCityLogos */
export function spreadSameCity<T extends NamedPin>(rows: T[], cellDeg = 0.14): (T & { slot: number; slots: number })[] {
  return layoutCityLogos(rows, Math.max(0.02, cellDeg * 0.35));
}

export function slotShift(slot: number, slots: number) {
  if (slots <= 1) return 0;
  return (slot - (slots - 1) / 2) * 100;
}

export function fanLon<T extends { lat: number; lon: number; slot: number; slots: number }>(
  rows: T[],
  gapDeg: number,
): (T & { lat0: number; lon0: number })[] {
  return layoutCityLogos(rows as T & NamedPin, gapDeg) as (T & { lat0: number; lon0: number })[];
}
