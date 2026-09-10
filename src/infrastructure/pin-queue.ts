import { parseMapCsv, socialsFromCsv, stringifyMapCsv } from "@/domain/map-csv";
import { PIN_TTL_MS } from "@/domain/community-pins";
import { clearGlobeStatsCache } from "./globe-stats";
import { loadMapCsvText, saveMapCsvText } from "./map-csv-io";
import { scrapeShowsToken } from "./pin-verify";
import { loadPins, savePins } from "./pins-io";

type Job = { kind: "pin" | "map"; id: string };

const q: Job[] = [];
const seen = new Set<string>();
let busy = false;

function key(j: Job) {
  return `${j.kind}:${j.id}`;
}

export function enqueueVerify(kind: Job["kind"], id: string) {
  const j: Job = { kind, id };
  const k = key(j);
  if (!id || seen.has(k)) return;
  if (q.length >= 12) return;
  seen.add(k);
  q.push(j);
  void pump();
}

export function enqueuePendingPins(ids: string[]) {
  for (const id of ids.slice(0, 4)) enqueueVerify("pin", id);
}

export function enqueuePendingMap(ids: string[]) {
  for (const id of ids.slice(0, 4)) enqueueVerify("map", id);
}

async function pump() {
  if (busy) return;
  const job = q.shift();
  if (!job) return;
  busy = true;
  try {
    if (job.kind === "pin") await runPin(job.id);
    else await runMap(job.id);
  } catch {
    /* one job optional */
  } finally {
    seen.delete(key(job));
    busy = false;
  }
  if (q.length) setTimeout(() => void pump(), 400);
}

async function runPin(id: string) {
  const rows = await loadPins();
  const pin = rows.find((p) => p.id === id);
  if (!pin || pin.verified) return;
  if (Date.now() - pin.created > PIN_TTL_MS) return;
  if (!pin.proof) return;
  const ok = await scrapeShowsToken(pin.proof, pin.token, pin.links);
  if (!ok) return;
  pin.verified = true;
  pin.verifiedAt = Date.now();
  await savePins(rows);
}

async function runMap(id: string) {
  const text = await loadMapCsvText();
  const rows = parseMapCsv(text);
  const row = rows.find((r) => r.id === id);
  if (!row || row.verifiedAt || !row.token) return;
  const urls = socialsFromCsv(row.socials)
    .map((l) => l.url)
    .filter(Boolean);
  if (!urls.length) return;
  const ok = await scrapeShowsToken(urls[0]!, row.token, urls.slice(1));
  if (!ok) return;
  row.verifiedAt = Date.now();
  await saveMapCsvText(stringifyMapCsv(rows));
  clearGlobeStatsCache();
}
