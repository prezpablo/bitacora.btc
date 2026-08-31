import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { mergeMapRows, parseMapCsv, stringifyMapCsv, type MapCsvRow } from "@/domain/map-csv";
import { metaGet, metaSet, openSqlite, sqlTx } from "./sqlite";

const SNAP = "public/data/map.csv";

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
         address=excluded.address, description=excluded.description, notes=excluded.notes,
         score=excluded.score, votes=excluded.votes, logo=excluded.logo, socials=excluded.socials,
         hours=excluded.hours, pays=excluded.pays, created=excluded.created, token=excluded.token,
         verified_at=excluded.verified_at`,
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
  if (metaGet("map_seeded") === "1") return;
  let text = "";
  for (const file of [join(process.cwd(), SNAP), SNAP, "/var/www/bitacora/public/data/map.csv"]) {
    try {
      text = await readFile(file, "utf8");
      if (text.includes("id,tipo,name")) break;
    } catch {
      /* next */
    }
  }
  const rows = parseMapCsv(text);
  if (rows.length) {
    sqlTx(() => {
      for (const r of rows) upsertMap(r);
    });
  }
  metaSet("map_seeded", "1");
}

let seed: Promise<void> | null = null;
function ensureSeed() {
  if (!seed) seed = seedFromCsv().catch(() => metaSet("map_seeded", "1"));
  return seed;
}

async function snapCsv(rows: MapCsvRow[]) {
  try {
    const csv = stringifyMapCsv(rows);
    await mkdir(dirname(join(process.cwd(), SNAP)), { recursive: true });
    await writeFile(join(process.cwd(), SNAP), csv, "utf8");
  } catch {
    /* snapshot optional */
  }
}

function allRows(): MapCsvRow[] {
  return openSqlite().prepare("SELECT * FROM map_rows").all().map(rowFromSql).filter((r) => r.id);
}

export async function loadMapCsvText(): Promise<string> {
  await ensureSeed();
  return stringifyMapCsv(allRows());
}

export async function saveMapCsvText(csv: string): Promise<boolean> {
  if (!csv || csv.length > 350_000) return false;
  const incoming = parseMapCsv(csv);
  if (incoming.length > 400) return false;
  await ensureSeed();
  const current = allRows();
  const have = new Set(current.map((r) => r.id));
  const added = incoming.filter((r) => !have.has(r.id)).length;
  if (added > 8) return false;
  const merged = mergeMapRows(current, incoming);
  sqlTx(() => {
    for (const r of merged) upsertMap(r);
  });
  await snapCsv(merged);
  return true;
}
