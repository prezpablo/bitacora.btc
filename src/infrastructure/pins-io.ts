import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { mergePins, parsePinsCsv, stringifyPinsCsv, type CommunityPin } from "@/domain/community-pins";
import { metaGet, metaSet, openSqlite, sqlTx } from "./sqlite";

const SNAP = "public/data/pins.csv";

function rowToPin(r: Record<string, unknown>): CommunityPin {
  return {
    id: String(r.id || ""),
    name: String(r.name || "").slice(0, 80),
    blurb: String(r.blurb || "").slice(0, 220),
    proof: String(r.proof || ""),
    links: String(r.links || "")
      .split("|")
      .map((u) => u.trim())
      .filter((u) => /^https?:\/\//i.test(u)),
    token: String(r.token || ""),
    verified: Number(r.verified) === 1,
    verifiedAt: Number(r.verified_at) || 0,
    created: Number(r.created) || Date.now(),
  };
}

function upsertPin(pin: CommunityPin) {
  openSqlite()
    .prepare(
      `INSERT INTO pins(id, name, blurb, proof, links, token, verified, verified_at, created)
       VALUES(?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, blurb=excluded.blurb, proof=excluded.proof, links=excluded.links,
         token=excluded.token, verified=excluded.verified, verified_at=excluded.verified_at, created=excluded.created`,
    )
    .run(
      pin.id,
      pin.name,
      pin.blurb,
      pin.proof,
      pin.links.join("|"),
      pin.token,
      pin.verified ? 1 : 0,
      pin.verifiedAt,
      pin.created,
    );
}

async function seedFromCsv() {
  if (metaGet("pins_seeded") === "1") return;
  const files = [join(process.cwd(), SNAP), SNAP, "/var/www/bitacora/public/data/pins.csv"];
  let text = "";
  for (const file of files) {
    try {
      text = await readFile(file, "utf8");
      if (text.includes("id,name")) break;
    } catch {
      /* next */
    }
  }
  const rows = parsePinsCsv(text);
  if (rows.length) {
    sqlTx(() => {
      for (const p of rows) upsertPin(p);
    });
  }
  metaSet("pins_seeded", "1");
}

let seed: Promise<void> | null = null;
function ensureSeed() {
  if (!seed) seed = seedFromCsv().catch(() => metaSet("pins_seeded", "1"));
  return seed;
}

async function snapCsv(rows: CommunityPin[]) {
  try {
    const csv = stringifyPinsCsv(rows);
    await mkdir(dirname(join(process.cwd(), SNAP)), { recursive: true });
    await writeFile(join(process.cwd(), SNAP), csv, "utf8");
  } catch {
    /* snapshot optional */
  }
}

export async function loadPins(): Promise<CommunityPin[]> {
  await ensureSeed();
  const raw = openSqlite().prepare("SELECT * FROM pins").all();
  return raw.map(rowToPin).filter((p) => p.id && /^https?:\/\//i.test(p.proof));
}

export async function savePins(rows: CommunityPin[]): Promise<boolean> {
  await ensureSeed();
  const current = await loadPins();
  const merged = mergePins(current, rows);
  sqlTx(() => {
    for (const p of merged) upsertPin(p);
  });
  await snapCsv(merged);
  return true;
}

export async function replacePins(rows: CommunityPin[]): Promise<boolean> {
  await ensureSeed();
  sqlTx(() => {
    openSqlite().exec("DELETE FROM pins");
    for (const p of rows) upsertPin(p);
  });
  await snapCsv(rows);
  return true;
}

export async function countPendingPins(now = Date.now(), ttlMs = 7 * 24 * 60 * 60_000) {
  await ensureSeed();
  const row = openSqlite()
    .prepare("SELECT COUNT(*) AS n FROM pins WHERE verified = 0 AND created > ?")
    .get(now - ttlMs);
  return Number(row?.n) || 0;
}
