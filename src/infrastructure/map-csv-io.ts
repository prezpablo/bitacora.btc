import { mergeMapRows, parseMapCsv, stringifyMapCsv } from "@/domain/map-csv";

const FILE = "public/data/map.csv";
const RAW =
  "https://raw.githubusercontent.com/prezpablo/bitacora.btc/main/public/data/map.csv";

async function readLocal(): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  try {
    return await readFile(FILE, "utf8");
  } catch {
    return "";
  }
}

async function writeLocal(csv: string) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, csv, "utf8");
}

async function pushGithub(csv: string) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (!token) return false;
  const owner = process.env.GITHUB_MAP_OWNER || "prezpablo";
  const repo = process.env.GITHUB_MAP_REPO || "bitacora.btc";
  const path = "public/data/map.csv";
  const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  let sha: string | undefined;
  if (meta.ok) {
    const body = (await meta.json()) as { sha?: string };
    sha = body.sha;
  }
  const put = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "map: sync CSV",
      content: Buffer.from(csv, "utf8").toString("base64"),
      sha,
      branch: "main",
    }),
  });
  return put.ok;
}

export async function loadMapCsvText(): Promise<string> {
  const local = await readLocal();
  try {
    const res = await fetch(RAW, { cache: "no-store" });
    if (res.ok) {
      const remote = await res.text();
      if (remote.includes("id,tipo,name")) {
        const merged = stringifyMapCsv(mergeMapRows(parseMapCsv(local), parseMapCsv(remote)));
        return merged;
      }
    }
  } catch {
    /* keep local */
  }
  return local;
}

export async function saveMapCsvText(csv: string): Promise<boolean> {
  if (!csv || csv.length > 350_000) return false;
  const incoming = parseMapCsv(csv);
  if (incoming.length > 400) return false;
  const current = parseMapCsv(await readLocal());
  const have = new Set(current.map((r) => r.id));
  const added = incoming.filter((r) => !have.has(r.id)).length;
  if (added > 8) return false;
  const merged = stringifyMapCsv(mergeMapRows(current, incoming));
  await writeLocal(merged);
  try {
    await pushGithub(merged);
  } catch {
    /* token optional */
  }
  return true;
}
