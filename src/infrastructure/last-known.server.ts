import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Snap<T> = { at: number; data: T };

let dir = join(process.cwd(), "data");

export function setLastKnownDir(path: string) {
  dir = path;
}

function file(key: string) {
  return join(dir, `last-${key}.json`);
}

export function readLast<T>(key: string): Snap<T> | null {
  try {
    const row = JSON.parse(readFileSync(file(key), "utf8")) as Snap<T>;
    if (!row?.data || !row.at) return null;
    return row;
  } catch {
    return null;
  }
}

export function writeLast<T>(key: string, data: T) {
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file(key), JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* preview / read-only */
  }
}

export async function withLastKnown<T>(key: string, load: () => Promise<T>, ok?: (v: T) => boolean): Promise<T> {
  try {
    const data = await load();
    if (!ok || ok(data)) {
      writeLast(key, data);
      return data;
    }
  } catch (e) {
    const snap = readLast<T>(key);
    if (snap) return snap.data;
    throw e;
  }
  const snap = readLast<T>(key);
  if (snap) return snap.data;
  throw new Error(`${key} empty`);
}
