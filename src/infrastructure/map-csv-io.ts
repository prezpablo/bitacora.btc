import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { mergeMapRows, parseMapCsv, stringifyMapCsv, type MapCsvRow } from "@/domain/map-csv";
import { openSqlite, sqlTx } from "./sqlite";
import { readFirstFile } from "./data-files";

const SNAP = "public/data/map.csv";

const FOUNDING: MapCsvRow = {
  id: "c:cc-btc",
  tipo: "community",
  name: "Consciencia Bitcoin",
  lat: -34.47051920882338,
  lon: -57.84668721120329,
  address: "Colonia del Sacramento, Uruguay",
  description:
    "Consciencia Bitcoin es una iniciativa comunitaria nacida en Colonia del Sacramento, Uruguay, impulsada por LATAM Cripto Mom —un espacio dedicado a la educación financiera familiar, la divulgación de Web3 y la soberanía digital de forma simple y humana—.",
  notes: "",
  score: 0,
  votes: 0,
  logo: "/logos/conciencia-bitcoin.png",
  socials: "",
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
    if (!have.has(FOUNDING.id)) upsertMap(FOUNDING);
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
  const rows = allRows();
  if (!rows.some((r) => r.id === FOUNDING.id)) {
    sqlTx(() => upsertMap(FOUNDING));
  }
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
  if (!merged.some((r) => r.id === FOUNDING.id)) merged.push(FOUNDING);
  sqlTx(() => {
    for (const r of merged) upsertMap(r);
  });
  await snapCsv(merged);
  return true;
}
