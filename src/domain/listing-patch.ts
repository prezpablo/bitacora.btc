import { makePinToken } from "./community-pins.ts";
import type { MapCsvRow } from "./map-csv.ts";

export const PATCH_TTL_MS = 7 * 86_400_000;
export const PATCH_MAX_MOVE_M = 80;

export type ListingPatchFields = {
  name?: string;
  description?: string;
  address?: string;
  notes?: string;
  logo?: string;
};

export type ListingPatch = {
  id: string;
  listingId: string;
  tipo: MapCsvRow["tipo"];
  token: string;
  proof: string;
  fields: ListingPatchFields;
  lat: number;
  lon: number;
  created: number;
  verified: boolean;
  verifiedAt: number;
};

export type PatchErr = "need" | "links" | "move" | "nochange" | "notours" | "name";

const OURS = /^(local:|c:)/;

export function listingIsOurs(id: string) {
  return OURS.test(id);
}

export function metersBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

function cleanHttp(raw: string) {
  const t = String(raw || "").trim();
  if (!t || /^javascript:/i.test(t)) return "";
  if (t.startsWith("data:") && !/^data:image\//i.test(t)) return "";
  return t.slice(0, 300);
}

export function sanitizePatchFields(raw: ListingPatchFields): ListingPatchFields {
  const out: ListingPatchFields = {};
  const name = (raw.name || "").trim().slice(0, 80);
  const description = (raw.description || "").trim().slice(0, 500);
  const address = (raw.address || "").trim().slice(0, 160);
  const notes = (raw.notes || "").trim().slice(0, 280);
  const logo = cleanHttp(raw.logo || "");
  if (name) out.name = name;
  if (description) out.description = description;
  if (address) out.address = address;
  if (notes) out.notes = notes;
  if (logo) out.logo = logo;
  return out;
}

export function patchChanged(row: Pick<MapCsvRow, "name" | "description" | "address" | "notes" | "logo">, fields: ListingPatchFields) {
  if (fields.name && fields.name !== row.name) return true;
  if (fields.description && fields.description !== row.description) return true;
  if (fields.address && fields.address !== row.address) return true;
  if (fields.notes && fields.notes !== row.notes) return true;
  if (fields.logo && fields.logo !== row.logo) return true;
  return false;
}

export function patchAlive(p: Pick<ListingPatch, "created" | "verified">, now = Date.now()) {
  if (p.verified) return true;
  return now - p.created < PATCH_TTL_MS;
}

export function proposePatch(
  row: MapCsvRow,
  raw: ListingPatchFields,
  proof: string,
  now = Date.now(),
): { patch: ListingPatch } | { error: PatchErr } {
  const fields = sanitizePatchFields(raw);
  const url = cleanHttp(proof);
  if (!/^https?:\/\//i.test(url)) return { error: "links" };
  if (listingIsOurs(row.id) && !patchChanged(row, fields)) return { error: "nochange" };
  if (!listingIsOurs(row.id) && !patchChanged(row, fields) && !fields.name && !row.name) return { error: "need" };
  if (fields.name !== undefined && fields.name.length < 2) return { error: "name" };
  return {
    patch: {
      id: `patch:${now.toString(36)}`,
      listingId: row.id,
      tipo: row.tipo,
      token: makePinToken(),
      proof: url,
      fields,
      lat: row.lat,
      lon: row.lon,
      created: now,
      verified: false,
      verifiedAt: 0,
    },
  };
}

export function applyPatchToRow(row: MapCsvRow, patch: ListingPatch, now = Date.now()): MapCsvRow {
  const f = patch.fields;
  return {
    ...row,
    name: f.name || row.name,
    description: f.description ?? row.description,
    address: f.address ?? row.address,
    notes: f.notes ?? row.notes,
    logo: f.logo || row.logo,
    verifiedAt: now,
  };
}

export function makeContactTicket() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `TKT-${s}`;
}
