import Supercluster from "supercluster";
import type { ShopPin } from "@/domain";
import { catalogCount, catalogShopPins, ensureCatalog } from "./catalog.ts";

export type ShopPointProps = { id: string; icon: string; name: string };

export function loadShopIndex(shops: ShopPin[]) {
  const index = new Supercluster<ShopPointProps>({ radius: 48, maxZoom: 16, minPoints: 3 });
  index.load(
    shops
      .filter((s) => s.id && Number.isFinite(s.lat) && Number.isFinite(s.lon))
      .map((s) => ({
        type: "Feature" as const,
        properties: { id: s.id, icon: s.icon || "lugar", name: s.name || s.id },
        geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] as [number, number] },
      })),
  );
  return index;
}

/** D-PIN-03: id,lat,lon,icon,name. Sin logo ni descripción. */
export function placesFromClusters(
  index: Supercluster<ShopPointProps>,
  bbox: [number, number, number, number],
  zoom: number,
): ShopPin[] {
  const z = Math.max(0, Math.min(16, Math.floor(zoom)));
  const hits = index.getClusters(bbox, z);
  const out: ShopPin[] = [];
  for (const f of hits) {
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties;
    if (p && "cluster" in p && p.cluster) {
      const cid = Number(p.cluster_id);
      const leaves = index.getLeaves(cid, Infinity);
      const inView = leaves.filter((leaf) => {
        const [x, y] = leaf.geometry.coordinates;
        return x >= bbox[0] && y >= bbox[1] && x <= bbox[2] && y <= bbox[3];
      });
      const n = inView.length || Number(p.point_count) || 0;
      // Calle / grupo chico / la mayoría del cluster está fuera: listar fichas, no un 93 mentiroso.
      if (z >= 12 || n <= 8 || n < (Number(p.point_count) || 0) * 0.5) {
        for (const leaf of inView.length ? inView : leaves) {
          const [x, y] = leaf.geometry.coordinates;
          const prop = leaf.properties as ShopPointProps;
          if (!prop?.id) continue;
          out.push({ id: prop.id, lat: y, lon: x, icon: prop.icon || "lugar", name: prop.name || prop.id });
        }
        continue;
      }
      out.push({ id: `cluster:${cid}`, lat, lon, icon: "cluster", name: String(n), clusterCount: n });
      continue;
    }
    const leaf = p as ShopPointProps;
    out.push({ id: leaf.id, lat, lon, icon: leaf.icon || "lugar", name: leaf.name || leaf.id });
  }
  return out;
}

let index: Supercluster<ShopPointProps> | null = null;
let indexedN = -1;

export function clusteredCatalogShops(
  b: { west: number; south: number; east: number; north: number },
  zoom: number,
): ShopPin[] {
  ensureCatalog();
  const n = catalogCount();
  if (!index || indexedN !== n) {
    index = loadShopIndex(catalogShopPins());
    indexedN = n;
  }
  return placesFromClusters(index, [b.west, b.south, b.east, b.north], zoom);
}

export function resetShopIndex() {
  index = null;
  indexedN = -1;
}