import { mergePins, parsePinsCsv, stringifyPinsCsv, type CommunityPin } from "@/domain/community-pins";

const FILE = "public/data/pins.csv";
const RAW = "https://raw.githubusercontent.com/prezpablo/bitacora.btc/main/public/data/pins.csv";

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

export async function loadPins(): Promise<CommunityPin[]> {
  const local = await readLocal();
  let remote = "";
  try {
    const res = await fetch(RAW, { cache: "no-store" });
    if (res.ok) remote = await res.text();
  } catch {
    /* local only */
  }
  const rows = mergePins(parsePinsCsv(local), parsePinsCsv(remote));
  return rows;
}

export async function savePins(rows: CommunityPin[]): Promise<boolean> {
  const current = await loadPins();
  const merged = mergePins(current, rows);
  const csv = stringifyPinsCsv(merged);
  await writeLocal(csv);
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (!token) return true;
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
  return true;
}
