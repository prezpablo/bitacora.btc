import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { stringifyPinsCsvPublic } from "../src/domain/community-pins.ts";
import { loadPins } from "../src/infrastructure/pins-io.ts";
import { purgeRetention } from "../src/infrastructure/retention.ts";
import { openSqlite } from "../src/infrastructure/sqlite.ts";

await loadPins().catch(() => []);
const n = purgeRetention();
const left = openSqlite()
  .prepare("SELECT * FROM pins")
  .all()
  .map((r) => ({
    id: String(r.id || ""),
    name: String(r.name || ""),
    blurb: String(r.blurb || ""),
    proof: String(r.proof || ""),
    links: String(r.links || "")
      .split("|")
      .map((u) => u.trim())
      .filter(Boolean),
    token: "",
    verified: Number(r.verified) === 1,
    verifiedAt: Number(r.verified_at) || 0,
    created: Number(r.created) || 0,
  }))
  .filter((p) => p.id);
const snap = join(process.cwd(), "public/data/pins.csv");
await mkdir(dirname(snap), { recursive: true });
await writeFile(snap, stringifyPinsCsvPublic(left), "utf8");
console.log(`[retain] ${JSON.stringify(n)}`);
