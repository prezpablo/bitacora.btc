export const PIN_TTL_MS = 7 * 24 * 60 * 60_000;
export const PIN_HEADERS = ["id", "name", "blurb", "proof", "links", "token", "verified", "verifiedAt", "created"] as const;

export type CommunityPin = {
  id: string;
  name: string;
  blurb: string;
  proof: string;
  links: string[];
  token: string;
  verified: boolean;
  verifiedAt: number;
  created: number;
};

export function pinAlive(p: CommunityPin, now = Date.now()) {
  return p.verified && p.verifiedAt > 0 && now - p.verifiedAt < PIN_TTL_MS;
}

/** Pedido aún no verificado: visible en el tablero hasta 7 días o cancelar. */
export function pinPending(p: CommunityPin, now = Date.now()) {
  return !p.verified && now - p.created < PIN_TTL_MS;
}

export function pinOnBoard(p: CommunityPin, now = Date.now()) {
  return pinAlive(p, now) || pinPending(p, now);
}

export function pinDaysLeft(p: CommunityPin, now = Date.now()) {
  if (!pinAlive(p, now)) return 0;
  return Math.max(0, Math.ceil((PIN_TTL_MS - (now - p.verifiedAt)) / 86_400_000));
}

/** Weekly shuffle so pins never keep a permanent rank. */
export function pinWeekPose(id: string, week = Math.floor(Date.now() / PIN_TTL_MS)) {
  let h = week + 19;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return { order: h, rot: (h % 13) - 6 };
}

export function makePinToken() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `CARGA-${s}`;
}

function cell(v: string | number | boolean) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function splitLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
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

export function parsePinsCsv(text: string): CommunityPin[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const head = splitLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (n: string) => head.indexOf(n);
  const rows: CommunityPin[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitLine(line);
    const get = (n: string) => (idx(n) >= 0 ? cols[idx(n)] || "" : "").trim();
    const id = get("id");
    if (!id) continue;
    const proof = get("proof");
    if (!/^https?:\/\//i.test(proof)) continue;
    rows.push({
      id,
      name: get("name").slice(0, 80),
      blurb: get("blurb").slice(0, 220),
      proof,
      links: get("links")
        .split("|")
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//i.test(u)),
      token: get("token"),
      verified: get("verified") === "1" || get("verified") === "true",
      verifiedAt: Number(get("verifiedat") || get("verifiedAt")) || 0,
      created: Number(get("created")) || Date.now(),
    });
  }
  return rows;
}

export function stringifyPinsCsv(rows: CommunityPin[]) {
  const body = rows.map((r) =>
    [r.id, r.name, r.blurb, r.proof, r.links.join("|"), r.token, r.verified ? "1" : "0", r.verifiedAt, r.created].map(cell).join(","),
  );
  return [PIN_HEADERS.join(","), ...body].join("\n") + "\n";
}

/** CSV público: el código CARGA no sale a GitHub ni al tablero. */
export function stringifyPinsCsvPublic(rows: CommunityPin[]) {
  return stringifyPinsCsv(rows.map((p) => ({ ...p, token: "" })));
}

export function mergePins(base: CommunityPin[], incoming: CommunityPin[]) {
  const map = new Map(base.map((p) => [p.id, p]));
  for (const p of incoming) {
    const prev = map.get(p.id);
    if (!prev) {
      map.set(p.id, p);
      continue;
    }
    const next = { ...prev, ...p };
    if (prev.verified && !p.verified) {
      next.verified = true;
      next.verifiedAt = prev.verifiedAt;
    }
    map.set(p.id, next);
  }
  return [...map.values()];
}
