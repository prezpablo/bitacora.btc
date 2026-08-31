import { join } from "node:path";

/** Repo, Nitro output, VPS. First readable file wins. */
export function dataCandidates(rel: string) {
  const cwd = process.cwd();
  const name = rel.replace(/^public\//, "");
  return [
    join(cwd, rel),
    join(cwd, "public", name),
    join(cwd, ".output/public", name),
    join("/var/www/bitacora", rel),
    join("/var/www/bitacora/public", name),
    join("/var/www/bitacora/.output/public", name),
    rel,
  ];
}

export async function readFirstFile(rel: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  for (const file of dataCandidates(rel)) {
    try {
      const text = await readFile(file, "utf8");
      if (text.trim()) return text;
    } catch {
      /* next */
    }
  }
  return "";
}
