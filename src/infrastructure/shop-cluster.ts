import Supercluster from "supercluster";
import type { MerchantPlace } from "@/domain";
import { catalogAllShops, catalogCount, ensureCatalog } from "./catalog.ts";

export type ShopPointProps = {
  id: string;
  name: string;
  category: string;
  createdAt: number;
  logo?: string;
  description?: string;
};

export function isShopCluster(p: { id: string; category?: string; clusterCount?: number }) {
  return (p.clusterCount ?? 0) > 1 || p.category === "cluster" || p.id.startsWith("cluster:");
}

export function loadShopIndex(shops: MerchantPlace[]) {
  const index = new Supercluster<ShopPointProps>({ radius: 72, maxZoom: 16, minPoints: 3 });
  index.load(
    shops
      .filter((s) => s.id && Number.isFinite(s.lat) && Number.isFinite(s.lon))
      .map((s) => ({
        type: "Feature" as const,
        properties: {
          id: s.id,
          name: s.name,
          category: s.category,
          createdAt: s.createdAt,
          logo: s.logo,
          description: s.description,
        },
        geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] as [number, number] },
      })),
  );
  return index;
}

export function placesFromClusters(
  index: Supercluster<ShopPointProps>,
  bbox: [number, number, number, number],
  zoom: number,
): MerchantPlace[] {
  const z = Math.max(0, Math.min(16, Math.floor(zoom)));
  const hits = index.getClusters(bbox, z);
  const out: MerchantPlace[] = [];
  for (const f of hits) {
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties;
    if (p && "cluster" in p && p.cluster) {
      const n = Number(p.point_count) || 0;
      out.push({
        id: `cluster:${p.cluster_id}`,
        lat,
        lon,
        name: String(n),
        category: "cluster",
        createdAt: 0,
        clusterCount: n,
      });
      continue;
    }
    const leaf = p as ShopPointProps;
    out.push({
      id: leaf.id,
      lat,
      lon,
      name: leaf.name,
      category: leaf.category,
      createdAt: leaf.createdAt,
      logo: leaf.logo,
      description: leaf.description,
    });
  }
  return out;
}

let index: Supercluster<ShopPointProps> | null = null;
let indexedN = -1;

export function clusteredCatalogShops(
  b: { west: number; south: number; east: number; north: number },
  zoom: number,
): MerchantPlace[] {
  ensureCatalog();
  const n = catalogCount();
  if (!index || indexedN !== n) {
    index = loadShopIndex(catalogAllShops());
    indexedN = n;
  }
  return placesFromClusters(index, [b.west, b.south, b.east, b.north], zoom);
}

export function resetShopIndex() {
  index = null;
  indexedN = -1;
}
