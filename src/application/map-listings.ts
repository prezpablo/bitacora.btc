/** Casos de uso del directorio. Sin Leaflet, sin fetch. */

import type { Community, MerchantLocal, MerchantPlace } from "@/domain";
import {
  draftCommunity,
  draftShop,
  rateCommunity,
  rateLocal,
  type CommDraft,
  type ComposeErr,
  type ShopDraft,
} from "@/domain/map-compose";
import {
  applyPatchToRow,
  proposePatch,
  type ListingPatch,
  type ListingPatchFields,
  type PatchErr,
} from "@/domain/listing-patch";
import type { MapCsvRow } from "@/domain/map-csv";

export type ListingBundle = {
  store: Record<string, MerchantLocal>;
  comms: Community[];
};

export function publishShop(
  bundle: ListingBundle,
  drop: { lat: number; lon: number },
  draft: ShopDraft,
): { ok: true; bundle: ListingBundle; place: MerchantPlace; local: MerchantLocal } | { ok: false; error: ComposeErr } {
  const made = draftShop(drop, draft);
  if ("error" in made) return { ok: false, error: made.error };
  return {
    ok: true,
    place: made.place,
    local: made.local,
    bundle: { ...bundle, store: { ...bundle.store, [made.place.id]: made.local } },
  };
}

export function publishCommunity(
  bundle: ListingBundle,
  drop: { lat: number; lon: number },
  draft: CommDraft,
): { ok: true; bundle: ListingBundle; row: Community } | { ok: false; error: ComposeErr } {
  const made = draftCommunity(
    drop,
    draft,
    bundle.comms.map((c) => c.slug),
  );
  if ("error" in made) return { ok: false, error: made.error };
  return { ok: true, row: made.row, bundle: { ...bundle, comms: [...bundle.comms, made.row] } };
}

export function rateShopListing(
  bundle: ListingBundle,
  place: MerchantPlace,
  stars: 1 | 2 | 3 | 4 | 5,
  nick: string,
  description: string,
): ListingBundle {
  const prev = bundle.store[place.id] ?? { description: "", votes: [], listedAt: place.createdAt };
  const local = rateLocal(
    {
      ...prev,
      lat: prev.lat ?? place.lat,
      lon: prev.lon ?? place.lon,
      name: prev.name || place.name,
      category: prev.category || place.category,
    },
    stars,
    nick,
    description,
  );
  return { ...bundle, store: { ...bundle.store, [place.id]: local } };
}

export function rateCommunityListing(
  bundle: ListingBundle,
  community: Community,
  stars: 1 | 2 | 3 | 4 | 5,
  nick: string,
): { bundle: ListingBundle; row: Community } {
  const row = rateCommunity(community, stars, nick);
  const comms = bundle.comms.some((x) => x.id === community.id)
    ? bundle.comms.map((x) => (x.id === community.id ? row : x))
    : [...bundle.comms, row];
  return { bundle: { ...bundle, comms }, row };
}

export function proposeListingPatch(
  row: MapCsvRow,
  fields: ListingPatchFields,
  proof: string,
): { ok: true; patch: ListingPatch } | { ok: false; error: PatchErr } {
  const made = proposePatch(row, fields, proof);
  if ("error" in made) return { ok: false, error: made.error };
  return { ok: true, patch: made.patch };
}

export function applyListingPatch(rows: MapCsvRow[], patch: ListingPatch, now = Date.now()): MapCsvRow[] {
  return rows.map((r) => (r.id === patch.listingId ? applyPatchToRow(r, patch, now) : r));
}
