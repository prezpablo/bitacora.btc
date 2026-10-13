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
  hours?: string;
  pays?: string;
  socials?: string;
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
  if (raw.name !== undefined) {
    const name = raw.name.trim().slice(0, 80);
    if (name) out.name = name;
  }
  if (raw.description !== undefined) out.description = raw.description.trim().slice(0, 500);
  if (raw.address !== undefined) out.address = raw.address.trim().slice(0, 160);
  if (raw.notes !== undefined) out.notes = raw.notes.trim().slice(0, 280);
  if (raw.logo !== undefined) out.logo = cleanHttp(raw.logo);
  if (raw.hours !== undefined) out.hours = raw.hours.replace(/\s+/g, "").slice(0, 200);
  if (raw.pays !== undefined) out.pays = raw.pays.trim().slice(0, 80);
  if (raw.socials !== undefined) out.socials = raw.socials.trim().slice(0, 800);
  return out;
}

export function patchChanged(row: Pick<MapCsvRow, "name" | "description" | "address" | "notes" | "logo" | "hours" | "pays" | "socials">, fields: ListingPatchFields) {
  if (fields.name && fields.name !== row.name) return true;
  if (fields.description !== undefined && fields.description !== row.description) return true;
  if (fields.address !== undefined && fields.address !== row.address) return true;
  if (fields.notes !== undefined && fields.notes !== row.notes) return true;
  if (fields.logo !== undefined && fields.logo !== row.logo) return true;
  if (fields.hours !== undefined && fields.hours !== row.hours) return true;
  if (fields.pays !== undefined && fields.pays !== row.pays) return true;
  if (fields.socials !== undefined && fields.socials !== row.socials) return true;
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
  at?: { lat: number; lon: number },
  now = Date.now(),
): { patch: ListingPatch } | { error: PatchErr } {
  const fields = sanitizePatchFields(raw);
  const url = cleanHttp(proof);
  if (url && !/^https?:\/\//i.test(url)) return { error: "links" };
  let lat = row.lat;
  let lon = row.lon;
  if (at && Number.isFinite(at.lat) && Number.isFinite(at.lon)) {
    if (metersBetween(row, at) > PATCH_MAX_MOVE_M) return { error: "move" };
    lat = at.lat;
    lon = at.lon;
  }
  const moved = lat !== row.lat || lon !== row.lon;
  if (!patchChanged(row, fields) && !moved) return { error: "nochange" };
  if (fields.name !== undefined && fields.name.length < 2) return { error: "name" };
  return {
    patch: {
      id: `patch:${now.toString(36)}`,
      listingId: row.id,
      tipo: row.tipo,
      token: makePinToken(),
      proof: url,
      fields,
      lat,
      lon,
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
    lat: Number.isFinite(patch.lat) ? patch.lat : row.lat,
    lon: Number.isFinite(patch.lon) ? patch.lon : row.lon,
    description: f.description ?? row.description,
    address: f.address ?? row.address,
    notes: f.notes !== undefined ? f.notes : row.notes,
    logo: f.logo !== undefined ? f.logo : row.logo,
    hours: f.hours !== undefined ? f.hours : row.hours,
    pays: f.pays !== undefined ? f.pays : row.pays,
    socials: f.socials !== undefined ? f.socials : row.socials,
    verifiedAt: now,
  };
}

export function makeContactTicket() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `TKT-${s}`;
}
