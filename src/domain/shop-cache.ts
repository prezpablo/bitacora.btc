import type { ShopPin } from "./entities";

export type ShopBbox = { west: number; south: number; east: number; north: number };

export type ShopBoxCache = { box: ShopBbox; shops: ShopPin[]; at: number; zoom: number };

export const SHOP_CACHE_TTL_MS = 60_000;

export function boxContains(outer: ShopBbox, inner: ShopBbox) {
  return outer.west <= inner.west && outer.east >= inner.east && outer.south <= inner.south && outer.north >= inner.north;
}

export function padBox(b: ShopBbox, pad: number): ShopBbox {
  return { west: b.west - pad, south: b.south - pad, east: b.east + pad, north: b.north + pad };
}

export function inShopBox(p: { lat: number; lon: number }, b: ShopBbox) {
  return p.lon >= b.west && p.lon <= b.east && p.lat >= b.south && p.lat <= b.north;
}

/** Snap the view so small pans/zooms share one fetch. */
export function quantizeBox(b: ShopBbox): ShopBbox {
  const span = Math.max(b.east - b.west, b.north - b.south, 0.02);
  const step = span >= 4 ? 1 : span >= 1 ? 0.25 : span >= 0.25 ? 0.05 : 0.02;
  const snap = (n: number, extra = 0) => Math.floor(n / step) * step - extra * step;
  return {
    west: snap(b.west, 1),
    south: snap(b.south, 1),
    east: snap(b.east) + step * 2,
    north: snap(b.north) + step * 2,
  };
}

export function shopsInView(shops: ShopPin[], view: ShopBbox, pad = 0.05) {
  const box = padBox(view, pad);
  return shops.filter((p) => inShopBox(p, box));
}

export function shopsFromCache(
  cache: ShopBoxCache[],
  view: ShopBbox,
  now: number,
  ttl = SHOP_CACHE_TTL_MS,
  zoom?: number,
): ShopPin[] | null {
  const live = cache.filter((e) => now - e.at < ttl);
  const cover = live.find((e) => boxContains(e.box, view) && (zoom == null || e.zoom === zoom));
  if (!cover) return null;
  return shopsInView(cover.shops, view);
}

export function rememberShopBox(
  cache: ShopBoxCache[],
  box: ShopBbox,
  shops: ShopPin[],
  now: number,
  ttl = SHOP_CACHE_TTL_MS,
  zoom = 0,
): ShopBoxCache[] {
  const next: ShopBoxCache = { box, shops, at: now, zoom };
  return [next, ...cache.filter((e) => now - e.at < ttl && !(sameBox(e.box, box) && e.zoom === zoom))].slice(0, 8);
}

function sameBox(a: ShopBbox, b: ShopBbox) {
  return a.west === b.west && a.south === b.south && a.east === b.east && a.north === b.north;
}
