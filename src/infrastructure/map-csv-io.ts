import { randomBytes } from "node:crypto";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { applyPublicMapPatch, mergeMapRows, parseMapCsv, stringifyMapCsv, stringifyMapCsvPublic, socialsToCsv, type MapCsvRow } from "@/domain/map-csv";
import { FOUNDING_DESCRIPTION, FOUNDING_LINKS, FOUNDING_UY } from "@/domain/globe";
import type { SocialLink } from "@/domain/socials";
import { openSqlite, sqlTx } from "./sqlite";
import { oneAtATime } from "./one-at-a-time";
import { readFirstFile } from "./data-files";

const SNAP = "public/data/map.csv";

const FOUNDING: MapCsvRow = {
  id: FOUNDING_UY.id,
  tipo: "community",
  name: FOUNDING_UY.name,
  lat: FOUNDING_UY.lat,
  lon: FOUNDING_UY.lon,
  address: "Colonia del Sacramento, Uruguay",
  description: FOUNDING_DESCRIPTION,
  notes: "",
  score: 0,
  votes: 0,
  logo: FOUNDING_UY.logo,
  socials: socialsToCsv(FOUNDING_LINKS as SocialLink[]),
  hours: "",
  pays: "",
  created: 1787790155172,
  token: "",
  verifiedAt: 1,
};

function rowFromSql(r: Record<string, unknown>): MapCsvRow {
  return {
    id: String(r.id || ""),
    tipo: r.tipo === "community" ? "community" : "shop",
    name: String(r.name || ""),
    lat: Number(r.lat) || 0,
    lon: Number(r.lon) || 0,
    address: String(r.address || ""),
    description: String(r.description || ""),
    notes: String(r.notes || ""),
    score: Number(r.score) || 0,
    votes: Math.max(0, Math.floor(Number(r.votes) || 0)),
    logo: String(r.logo || ""),
    socials: String(r.socials || ""),
    hours: String(r.hours || ""),
    pays: String(r.pays || ""),
    created: Number(r.created) || Date.now(),
    token: String(r.token || ""),
    verifiedAt: Number(r.verified_at) || 0,
  };
}

function upsertMap(row: MapCsvRow) {
  openSqlite()
    .prepare(
      `INSERT INTO map_rows(id, tipo, name, lat, lon, address, description, notes, score, votes, logo, socials, hours, pays, created, token, verified_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         tipo=excluded.tipo, name=excluded.name, lat=excluded.lat, lon=excluded.lon,
         address=CASE WHEN excluded.address != '' THEN excluded.address ELSE map_rows.address END,
         description=CASE WHEN excluded.description != '' THEN excluded.description ELSE map_rows.description END,
         notes=excluded.notes,
         score=map_rows.score, votes=map_rows.votes,
         logo=CASE WHEN excluded.logo != '' THEN excluded.logo ELSE map_rows.logo END,
         socials=CASE WHEN excluded.socials != '' THEN excluded.socials ELSE map_rows.socials END,
         hours=CASE WHEN excluded.hours != '' THEN excluded.hours ELSE map_rows.hours END,
         pays=CASE WHEN excluded.pays != '' THEN excluded.pays ELSE map_rows.pays END,
         token=CASE WHEN excluded.token != '' THEN excluded.token ELSE map_rows.token END,
         verified_at=MAX(map_rows.verified_at, excluded.verified_at)`,
    )
    .run(
      row.id,
      row.tipo,
      row.name,
      row.lat,
      row.lon,
      row.address,
      row.description,
      row.notes,
      row.score,
      row.votes,
      row.logo,
      row.socials,
      row.hours,
      row.pays,
      row.created,
      row.token,
      row.verifiedAt,
    );
}

async function seedFromCsv() {
  const text = await readFirstFile(SNAP);
  const rows = mergeMapRows(parseMapCsv(text), [FOUNDING]);
  sqlTx(() => {
    const have = new Set(
      openSqlite()
        .prepare("SELECT id FROM map_rows")
        .all()
        .map((r) => String(r.id || "")),
    );
    for (const r of rows) {
      if (!have.has(r.id)) upsertMap(r);
    }
    upsertMap(FOUNDING);
  });
}

let seed: Promise<void> | null = null;
function ensureSeed() {
  if (!seed) seed = seedFromCsv().catch((err) => {
    console.error("[map-csv] seed", err);
  });
  return seed;
}

async function snapCsv(rows: MapCsvRow[]) {
  const path = join(process.cwd(), SNAP);
  const tmp = `${path}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    const csv = stringifyMapCsvPublic(rows);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(tmp, csv, "utf8");
    await rename(tmp, path);
  } catch {
    await unlink(tmp).catch(() => undefined);
  }
}

function allRows(): MapCsvRow[] {
  return openSqlite().prepare("SELECT * FROM map_rows").all().map(rowFromSql).filter((r) => r.id);
}

export async function loadMapCsvText(): Promise<string> {
  return oneAtATime(async () => {
    try {
      await ensureSeed();
      const rows = allRows();
      if (!rows.some((r) => r.id === FOUNDING.id)) {
        sqlTx(() => upsertMap(FOUNDING));
      }
      const out = allRows();
      if (out.length) return stringifyMapCsv(out);
    } catch (err) {
      console.error("[map-csv] sqlite", err);
    }
    const file = await readFirstFile(SNAP);
    return file.includes("id,tipo") ? file : stringifyMapCsv([FOUNDING]);
  });
}

async function writeMapCsv(csv: string): Promise<boolean> {
  if (!csv || csv.length > 350_000) return false;
  const incoming = parseMapCsv(csv);
  if (incoming.length > 400) return false;
  await ensureSeed();
  const current = allRows();
  const have = new Set(current.map((r) => r.id));
  const added = incoming.filter((r) => !have.has(r.id)).length;
  if (added > 8) return false;
  const merged = mergeMapRows(current, incoming);
  if (!merged.some((r) => r.id === FOUNDING.id)) merged.push(FOUNDING);
  sqlTx(() => {
    for (const r of merged) upsertMap(r);
  });
  await snapCsv(merged);
  return true;
}

export async function saveMapCsvText(csv: string): Promise<boolean> {
  return oneAtATime(() => writeMapCsv(csv));
}

/** `who` es el HMAC de la IP, no la IP. Vacío = no se recuerda. */
function votesAlreadyCast(who: string): Set<string> {
  if (!who) return new Set();
  const rows = openSqlite().prepare("SELECT listing FROM vote_cast WHERE who = ?").all(who);
  return new Set(rows.map((r) => String(r.listing || "")).filter(Boolean));
}

export async function savePublicMapCsv(csv: string, who = ""): Promise<boolean> {
  return oneAtATime(async () => {
    if (!csv || csv.length > 350_000) return false;
    const voter = /^[a-f0-9]{16,64}$/.test(who) ? who : "";
    const incoming = parseMapCsv(csv);
    if (incoming.length > 400) return false;
    await ensureSeed();
    const current = allRows();
    const before = new Map(current.map((r) => [r.id, r.votes || 0]));
    const next = applyPublicMapPatch(current, incoming, votesAlreadyCast(voter));
    if (!next) return false;
    if (!next.some((r) => r.id === FOUNDING.id)) next.push(FOUNDING);
    const gained = next.filter((r) => (r.votes || 0) > (before.get(r.id) || 0)).map((r) => r.id);
    sqlTx(() => {
      for (const r of next) upsertMap(r);
      if (!voter || !gained.length) return;
      const ins = openSqlite().prepare("INSERT OR IGNORE INTO vote_cast(listing, who, at) VALUES(?,?,?)");
      const now = Date.now();
      for (const id of gained) ins.run(id, voter, now);
    });
    await snapCsv(next);
    return true;
  });
}

export async function countPendingMapRows(now = Date.now(), ttlMs = 7 * 24 * 60 * 60_000) {
  await ensureSeed();
  const row = openSqlite()
    .prepare(
      `SELECT COUNT(*) AS n FROM map_rows
       WHERE verified_at = 0 AND created > ?
         AND (id LIKE 'local:%' OR (id LIKE 'c:%' AND id != 'c:cc-btc'))`,
    )
    .get(now - ttlMs);
  return Number(row?.n) || 0;
}

export async function deleteUnverifiedMapRow(id: string, token: string): Promise<"ok" | "live" | "token"> {
  return oneAtATime(async () => {
    await ensureSeed();
    const row = openSqlite().prepare("SELECT token, verified_at FROM map_rows WHERE id = ?").get(id);
    if (!row) return "ok";
    if (Number(row.verified_at) > 0) return "live";
    if (String(row.token || "") !== token) return "token";
    sqlTx(() => {
      openSqlite().prepare("DELETE FROM map_rows WHERE id = ? AND verified_at = 0").run(id);
    });
    const left = allRows();
    await snapCsv(left);
    return "ok";
  });
}
