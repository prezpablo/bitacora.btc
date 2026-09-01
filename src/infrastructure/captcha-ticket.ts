import { createHash, randomBytes } from "node:crypto";
import { POW_BITS, powPayload, powZeroBits } from "@/lib/pow";
import { openSqlite } from "./sqlite";
import { tooMany, clientKey } from "./rate-limit";

const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MIN_AGE_MS = 1200;
const MAX_AGE_MS = 10 * 60_000;

function hashCode(code: string) {
  return createHash("sha256").update(`bitacora.captcha|${code}`).digest("hex");
}

function roll() {
  let s = "";
  for (let i = 0; i < 5; i++) s += ABC[Math.floor(Math.random() * ABC.length)]!;
  return s;
}

function ensurePowCols() {
  const db = openSqlite();
  try {
    db.exec("ALTER TABLE captcha ADD COLUMN salt TEXT NOT NULL DEFAULT ''");
  } catch {
    /* exists */
  }
  try {
    db.exec("ALTER TABLE captcha ADD COLUMN bits INTEGER NOT NULL DEFAULT 13");
  } catch {
    /* exists */
  }
}

export function powMatches(salt: string, nonce: string, bits: number) {
  if (!salt || !nonce || bits < 8) return false;
  const digest = createHash("sha256").update(powPayload(salt, nonce)).digest();
  return powZeroBits(digest) >= bits;
}

export function issueCaptchaTicket(): { id: string; code: string; salt: string; bits: number } | null {
  if (tooMany(clientKey("captcha-issue"), 40, 60 * 60_000)) return null;
  if (tooMany("captcha-issue:global", 400, 60 * 60_000)) return null;
  const id = randomBytes(9).toString("hex");
  const code = roll();
  const salt = randomBytes(8).toString("hex");
  const bits = POW_BITS;
  const now = Date.now();
  try {
    ensurePowCols();
    const db = openSqlite();
    db.prepare("INSERT INTO captcha(id, hash, salt, bits, created, used) VALUES(?,?,?,?,?,0)").run(
      id,
      hashCode(code),
      salt,
      bits,
      now,
    );
    if (Math.random() < 0.08) {
      db.prepare("DELETE FROM captcha WHERE created < ? OR used = 1").run(now - 2 * MAX_AGE_MS);
    }
  } catch {
    return null;
  }
  return { id, code, salt, bits };
}

export function consumeCaptchaTicket(id: string, typed: string, hp = "", nonce = "") {
  if (hp.trim()) return false;
  const ticket = (id || "").trim();
  const answer = (typed || "").trim().toUpperCase();
  const work = String(nonce || "").trim();
  if (ticket.length < 8 || answer.length < 4 || !work) return false;
  const now = Date.now();
  try {
    const db = openSqlite();
    const row = db.prepare("SELECT hash, salt, bits, created, used FROM captcha WHERE id = ?").get(ticket);
    if (!row || Number(row.used) !== 0) return false;
    const created = Number(row.created) || 0;
    if (now - created < MIN_AGE_MS || now - created > MAX_AGE_MS) return false;
    if (String(row.hash) !== hashCode(answer)) return false;
    const bits = Math.max(8, Number(row.bits) || POW_BITS);
    if (!powMatches(String(row.salt || ""), work, bits)) return false;
    db.prepare("UPDATE captcha SET used = 1 WHERE id = ? AND used = 0").run(ticket);
    return true;
  } catch {
    return false;
  }
}
