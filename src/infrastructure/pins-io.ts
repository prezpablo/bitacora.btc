import { mergePins, parsePinsCsv, stringifyPinsCsv, type CommunityPin } from "@/domain/community-pins";

const FILE = "public/data/pins.csv";
const RAW = "https://raw.githubusercontent.com/prezpablo/bitacora.btc/main/public/data/pins.csv";

async function pinsFiles() {
  const { join } = await import("node:path");
  return [join(process.cwd(), FILE), join(process.cwd(), "..", FILE), "/var/www/bitacora/public/data/pins.csv", FILE];
}

async function readLocal(): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  let best = "";
  let bestN = -1;
  for (const file of await pinsFiles()) {
    try {
      const text = await readFile(file, "utf8");
      const n = parsePinsCsv(text).length;
      if (n > bestN || (n === bestN && text.length > best.length)) {
        best = text;
        bestN = n;
      }
    } catch {
      /* next */
    }
  }
  return best;
}

async function writeLocal(csv: string) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  let ok = 0;
  let last: unknown;
  for (const file of await pinsFiles()) {
    try {
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, csv, "utf8");
      ok++;
    } catch (e) {
      last = e;
    }
  }
  if (!ok) throw last ?? new Error("pins write failed");
}

export async function loadPins(): Promise<CommunityPin[]> {
  const local = await readLocal();
  let remote = "";
  try {
    const res = await fetch(RAW, { cache: "no-store" });
    if (res.ok) remote = await res.text();
  } catch {
    /* local only */
  }
  return mergePins(parsePinsCsv(local), parsePinsCsv(remote));
}

async function pushGithub(csv: string) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (!token) return;
  try {
    const owner = process.env.GITHUB_MAP_OWNER || "prezpablo";
    const repo = process.env.GITHUB_MAP_REPO || "bitacora.btc";
    const path = "public/data/pins.csv";
    const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    let sha: string | undefined;
    if (meta.ok) {
      const body = (await meta.json()) as { sha?: string };
      sha = body.sha;
    }
    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "pins: sync community board",
        content: Buffer.from(csv, "utf8").toString("base64"),
        sha,
        branch: "main",
      }),
    });
  } catch {
    /* token optional */
  }
}

export async function savePins(rows: CommunityPin[]): Promise<boolean> {
  const current = await loadPins();
  const merged = mergePins(current, rows);
  const csv = stringifyPinsCsv(merged);
  await writeLocal(csv);
  await pushGithub(csv);
  return true;
}

export async function replacePins(rows: CommunityPin[]): Promise<boolean> {
  const csv = stringifyPinsCsv(rows);
  await writeLocal(csv);
  await pushGithub(csv);
  return true;
}
