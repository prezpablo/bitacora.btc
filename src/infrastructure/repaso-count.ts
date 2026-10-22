import { openSqlite, sqlTx } from "./sqlite.ts";

const KEY = "repaso_done";
let memory = 0;

function asCount(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Personas que terminaron el repaso. Solo un número, sin identidad. */
export function readRepasoCount(): number {
  try {
    const row = openSqlite().prepare("SELECT value FROM meta WHERE key = ?").get(KEY);
    const n = asCount(row?.value);
    if (n > memory) memory = n;
    return memory;
  } catch {
    return memory;
  }
}

export function addRepasoCount(): number {
  try {
    const n = sqlTx((db) => {
      const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(KEY);
      const next = asCount(row?.value) + 1;
      db.prepare("INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(KEY, String(next));
      return next;
    });
    memory = n;
    return n;
  } catch {
    memory += 1;
    return memory;
  }
}
