import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const FOOTER = ["bc1qyuynamp7tystcvqfnjsp25dxl56deu4vgxhl2j", "bc1qsxfx6clgz3ke6uwcyafd58u56rdwtauvv0ettq"];

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

test("the map csv has the 27 circular economies and the globe does not draw them", () => {
  const csv = readFileSync(new URL("../../public/data/map.csv", import.meta.url), "utf8");
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  const head = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => head.indexOf(name);
  const rows = lines.slice(1).map((line) => splitCsvLine(line)).filter((cols) => (cols[idx("tipo")] || "").replace(/^'+/, "") === "circular");
  assert.equal(rows.length, 27);
  const get = (cols: string[], name: string) => (cols[idx(name)] || "").replace(/^'+/, "");
  const ids = new Set(rows.map((cols) => get(cols, "id")));
  assert.equal(ids.size, 27);
  assert.ok(ids.has("circ:bitcoin-beach-el-salvador"));
  assert.ok(ids.has("circ:puntabitcoin"));
  assert.ok(ids.has("circ:bitcoin-makueni"));
  assert.ok(ids.has("circ:lugano-plan-b"));
  assert.ok(!ids.has("circ:ciudad-vieja"));
  assert.ok(!ids.has("circ:punta-del-este"));
  const ikorodu = rows.find((cols) => get(cols, "id") === "circ:bitcoin-ikorodu");
  assert.ok(ikorodu);
  assert.match(get(ikorodu, "address"), /Shagamu/);
  const lat = Number(get(ikorodu, "lat"));
  assert.ok(lat > 6 && lat < 7);
  for (const cols of rows) {
    assert.ok(get(cols, "name") && get(cols, "address"));
    assert.ok(Number.isFinite(Number(get(cols, "lat"))) && Number.isFinite(Number(get(cols, "lon"))));
    assert.match(get(cols, "description"), /Email: /);
    assert.equal(get(cols, "verifiedAt"), "");
    const blob = `${get(cols, "description")} ${get(cols, "socials")} ${get(cols, "notes")}`;
    for (const addr of FOOTER) assert.equal(blob.includes(addr), false, get(cols, "id"));
    assert.doesNotMatch(blob, /x\.combitcoin/);
  }
  const globe = readFileSync(new URL("../infrastructure/globe-stats.ts", import.meta.url), "utf8");
  assert.match(globe, /if \(r\.tipo === "circular"\) continue;/);
  const canvas = readFileSync(new URL("../components/map/world-globe.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(canvas, /circularPins/);
  const seed = readFileSync(new URL("../infrastructure/map-csv-io.ts", import.meta.url), "utf8");
  assert.match(seed, /tipo = 'circular'/);
});
