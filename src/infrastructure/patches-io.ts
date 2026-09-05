import type { ListingPatch } from "@/domain/listing-patch";
import { openSqlite, sqlTx } from "./sqlite";

function rowToPatch(r: Record<string, unknown>): ListingPatch {
  let fields: ListingPatch["fields"] = {};
  let lat = 0;
  let lon = 0;
  try {
    const parsed = JSON.parse(String(r.fields || "{}")) as ListingPatch["fields"] & { lat?: number; lon?: number };
    lat = Number(parsed.lat) || 0;
    lon = Number(parsed.lon) || 0;
    const { lat: _a, lon: _b, ...rest } = parsed;
    fields = rest;
  } catch {
    fields = {};
  }
  return {
    id: String(r.id || ""),
    listingId: String(r.listing_id || ""),
    tipo: String(r.tipo) === "community" ? "community" : "shop",
    token: String(r.token || ""),
    proof: String(r.proof || ""),
    fields,
    lat,
    lon,
    created: Number(r.created) || Date.now(),
    verified: Number(r.verified) === 1,
    verifiedAt: Number(r.verified_at) || 0,
  };
}

function upsertPatch(p: ListingPatch) {
  openSqlite()
    .prepare(
      `INSERT INTO listing_patches(id, listing_id, tipo, token, proof, fields, created, verified, verified_at)
       VALUES(?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         token=excluded.token, proof=excluded.proof, fields=excluded.fields,
         verified=MAX(listing_patches.verified, excluded.verified),
         verified_at=MAX(listing_patches.verified_at, excluded.verified_at)`,
    )
    .run(
      p.id,
      p.listingId,
      p.tipo,
      p.token,
      p.proof,
      JSON.stringify({ ...p.fields, lat: p.lat, lon: p.lon }),
      p.created,
      p.verified ? 1 : 0,
      p.verifiedAt,
    );
}

export async function loadPatches(): Promise<ListingPatch[]> {
  return openSqlite()
    .prepare("SELECT * FROM listing_patches")
    .all()
    .map(rowToPatch);
}

export async function savePatch(p: ListingPatch) {
  sqlTx(() => upsertPatch(p));
}

export async function replacePatches(rows: ListingPatch[]) {
  sqlTx(() => {
    openSqlite().exec("DELETE FROM listing_patches");
    for (const p of rows) upsertPatch(p);
  });
}

export async function countPendingPatches() {
  const row = openSqlite()
    .prepare("SELECT COUNT(*) AS n FROM listing_patches WHERE verified = 0")
    .get();
  return Number(row?.n) || 0;
}

export function saveContactTicket(p: {
  id: string;
  topic: string;
  listingId: string;
  name: string;
  email: string;
  message: string;
  created: number;
}) {
  try {
    openSqlite()
      .prepare(
        `INSERT INTO contact_tickets(id, topic, listing_id, name, email, message, created, status)
         VALUES(?,?,?,?,?,?,?,'open')`,
      )
      .run(p.id, p.topic, p.listingId, p.name, p.email, p.message, p.created);
  } catch {
    /* optional */
  }
}
