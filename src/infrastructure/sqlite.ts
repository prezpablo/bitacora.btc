import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

type Stmt = {
  run: (...args: unknown[]) => unknown;
  get: (...args: unknown[]) => Record<string, unknown> | undefined;
  all: (...args: unknown[]) => Record<string, unknown>[];
};

type SqliteDb = {
  exec: (sql: string) => void;
  prepare: (sql: string) => Stmt;
};

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
CREATE TABLE IF NOT EXISTS pins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  blurb TEXT NOT NULL DEFAULT '',
  proof TEXT NOT NULL,
  links TEXT NOT NULL DEFAULT '',
  token TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS map_rows (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  score REAL NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0,
  logo TEXT NOT NULL DEFAULT '',
  socials TEXT NOT NULL DEFAULT '',
  hours TEXT NOT NULL DEFAULT '',
  pays TEXT NOT NULL DEFAULT '',
  created INTEGER NOT NULL DEFAULT 0,
  token TEXT NOT NULL DEFAULT '',
  verified_at INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_hits (
  k TEXT NOT NULL,
  t INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS captcha (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  salt TEXT NOT NULL DEFAULT '',
  bits INTEGER NOT NULL DEFAULT 13,
  created INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS catalog (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  logo TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  socials TEXT NOT NULL DEFAULT '',
  created INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'btcmap'
);
CREATE TABLE IF NOT EXISTS listing_patches (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  token TEXT NOT NULL,
  proof TEXT NOT NULL,
  fields TEXT NOT NULL DEFAULT '{}',
  created INTEGER NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS contact_tickets (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  listing_id TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
);
CREATE TABLE IF NOT EXISTS consent_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  version TEXT NOT NULL,
  ip_hash TEXT NOT NULL DEFAULT '',
  ref TEXT NOT NULL DEFAULT '',
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  activity TEXT NOT NULL,
  city TEXT NOT NULL,
  when_at TEXT NOT NULL,
  price TEXT NOT NULL,
  proof TEXT NOT NULL DEFAULT '',
  token TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS vote_cast (
  listing TEXT NOT NULL,
  who TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (listing, who)
);
CREATE TABLE IF NOT EXISTS tr_cache (
  url TEXT NOT NULL,
  lang TEXT NOT NULL,
  src TEXT NOT NULL,
  text TEXT NOT NULL,
  from_lang TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (url, lang, src)
);
CREATE INDEX IF NOT EXISTS pins_created ON pins (created);
CREATE INDEX IF NOT EXISTS map_tipo ON map_rows (tipo);
CREATE INDEX IF NOT EXISTS catalog_tipo ON catalog (tipo);
CREATE INDEX IF NOT EXISTS catalog_geo ON catalog (lat, lon);
CREATE INDEX IF NOT EXISTS rate_hits_kt ON rate_hits (k, t);
CREATE INDEX IF NOT EXISTS captcha_created ON captcha (created);
CREATE INDEX IF NOT EXISTS patch_listing ON listing_patches (listing_id);
CREATE INDEX IF NOT EXISTS ticket_created ON contact_tickets (created);
`;

function dbPath() {
  const fromEnv = process.env.BITACORA_SQLITE?.trim();
  if (fromEnv) return fromEnv;
  return join(process.cwd(), "data", "bitacora.sqlite");
}

let db: SqliteDb | null = null;

export function sqlitePath() {
  return dbPath();
}

export function openSqlite(): SqliteDb {
  if (db) return db;
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  const req = createRequire(import.meta.url);
  const sqlite = req("node:sqlite") as { DatabaseSync: new (p: string) => SqliteDb };
  const opened = new sqlite.DatabaseSync(path);
  opened.exec(SCHEMA);
  db = opened;
  return opened;
}

export function sqlTx<T>(fn: (d: SqliteDb) => T): T {
  const d = openSqlite();
  d.exec("BEGIN IMMEDIATE");
  try {
    const out = fn(d);
    d.exec("COMMIT");
    return out;
  } catch (err) {
    try {
      d.exec("ROLLBACK");
    } catch {
      /* empty */
    }
    throw err;
  }
}

export function metaGet(key: string) {
  const row = openSqlite().prepare("SELECT value FROM meta WHERE key = ?").get(key);
  return typeof row?.value === "string" ? row.value : "";
}

export function metaSet(key: string, value: string) {
  openSqlite().prepare("INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}
