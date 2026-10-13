import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Experience } from "@/domain/experience";
import { openSqlite, sqlTx } from "./sqlite";
import { readFirstFile } from "./data-files";

const SNAP = "public/data/experiences.csv";

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

export function parseExperiencesCsv(text: string): Experience[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const head = splitLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (n: string) => head.indexOf(n);
  const rows: Experience[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitLine(line);
    const get = (n: string) => (idx(n) >= 0 ? cols[idx(n)] || "" : "").trim();
    const id = get("id");
    if (!id) continue;
    rows.push({
      id,
      activity: get("activity").slice(0, 120),
      city: get("city").slice(0, 80),
      when: get("when").slice(0, 40),
      price: get("price").slice(0, 16),
      proof: get("proof"),
      token: "",
      verified: true,
      verifiedAt: Number(get("verifiedat")) || 0,
      created: Number(get("created")) || Date.now(),
    });
  }
  return rows.filter((r) => /^https?:\/\//i.test(r.proof));
}

function stringifyPublic(rows: Experience[]) {
  const body = rows
    .filter((r) => r.verified && /^https?:\/\//i.test(r.proof))
    .map((r) => [r.id, r.activity, r.city, r.when, r.price, r.proof, r.verifiedAt || "", r.created].map(cell).join(","));
  return ["id,activity,city,when,price,proof,verifiedAt,created", ...body].join("\n") + "\n";
}

function rowToXp(r: Record<string, unknown>): Experience {
  return {
    id: String(r.id || ""),
    activity: String(r.activity || "").slice(0, 120),
    city: String(r.city || "").slice(0, 80),
    when: String(r.when_at || "").slice(0, 40),
    price: String(r.price || "").slice(0, 16),
    proof: String(r.proof || ""),
    token: String(r.token || ""),
    verified: Number(r.verified) === 1,
    verifiedAt: Number(r.verified_at) || 0,
    created: Number(r.created) || Date.now(),
  };
}

function upsert(row: Experience) {
  openSqlite()
    .prepare(
      `INSERT INTO experiences(id, activity, city, when_at, price, proof, token, verified, verified_at, created)
       VALUES(?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         activity=excluded.activity, city=excluded.city, when_at=excluded.when_at, price=excluded.price,
         proof=excluded.proof, token=excluded.token,
         verified=MAX(experiences.verified, excluded.verified),
         verified_at=MAX(experiences.verified_at, excluded.verified_at), created=excluded.created`,
    )
    .run(row.id, row.activity, row.city, row.when, row.price, row.proof, row.token, row.verified ? 1 : 0, row.verifiedAt, row.created);
}

async function seedFromCsv() {
  const text = await readFirstFile(SNAP);
  const rows = parseExperiencesCsv(text);
  if (!rows.length) return;
  sqlTx(() => {
    const have = new Set(openSqlite().prepare("SELECT id FROM experiences").all().map((r) => String(r.id || "")));
    for (const r of rows) if (!have.has(r.id)) upsert(r);
  });
}

let seed: Promise<void> | null = null;
function ensureSeed() {
  if (!seed) seed = seedFromCsv().catch((err) => console.error("[experiences] seed", err));
  return seed;
}

async function snap(rows: Experience[]) {
  try {
    await mkdir(dirname(join(process.cwd(), SNAP)), { recursive: true });
    await writeFile(join(process.cwd(), SNAP), stringifyPublic(rows), "utf8");
  } catch {
    /* snapshot optional */
  }
}

export async function loadExperiences(): Promise<Experience[]> {
  await ensureSeed();
  return openSqlite().prepare("SELECT * FROM experiences").all().map(rowToXp).filter((r) => r.id);
}

export async function saveExperiences(rows: Experience[]) {
  await ensureSeed();
  sqlTx(() => {
    for (const r of rows) upsert(r);
  });
  await snap(await loadExperiences());
}

export async function replaceExperiences(rows: Experience[]) {
  await ensureSeed();
  sqlTx(() => {
    openSqlite().exec("DELETE FROM experiences");
    for (const r of rows) upsert(r);
  });
  await snap(rows);
}

export async function countPendingExperiences(now = Date.now(), ttlMs = 7 * 24 * 60 * 60_000) {
  await ensureSeed();
  const row = openSqlite().prepare("SELECT COUNT(*) AS n FROM experiences WHERE verified = 0 AND created > ?").get(now - ttlMs);
  return Number(row?.n) || 0;
}
