import Supercluster from "supercluster";
import type { ShopPin } from "@/domain";
import { catalogCount, catalogShopPins, ensureCatalog } from "./catalog.ts";

export type ShopPointProps = { id: string; icon: string; name: string };

function normShopId(id: string) {
  return id
    .trim()
    .toLowerCase()
    .replace(/^osm:(node|way|relation):/, "$1:")
    .replace(/^btcmap:/, "");
}

function nearShop(a: ShopPin, b: ShopPin) {
  const dlat = (a.lat - b.lat) * 111;
  const dlon = (a.lon - b.lon) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dlat, dlon) < 0.08;
}

/** Una ficha por id OSM y por el mismo nombre en el mismo punto. El índice no cuenta copias. */
export function uniqueShopPins(shops: ShopPin[]): ShopPin[] {
  const seen = new Set<string>();
  const cells = new Map<string, ShopPin[]>();
  const out: ShopPin[] = [];
  for (const s of shops) {
    if (!s.id || !Number.isFinite(s.lat) || !Number.isFinite(s.lon)) continue;
    const id = normShopId(s.id);
    if (!id || seen.has(id)) continue;
    const name = (s.name || "").trim().toLowerCase();
    const i = Math.round(s.lat * 500);
    const j = Math.round(s.lon * 500);
    let copy = false;
    for (let di = -1; di <= 1 && !copy; di++) {
      for (let dj = -1; dj <= 1 && !copy; dj++) {
        for (const k of cells.get(`${i + di}_${j + dj}`) || []) {
          if (!nearShop(k, s)) continue;
          const kn = (k.name || "").trim().toLowerCase();
          if (!name || !kn || name === kn) copy = true;
        }
      }
    }
    if (copy) continue;
    seen.add(id);
    out.push(s);
    const key = `${i}_${j}`;
    const bucket = cells.get(key) || [];
    bucket.push(s);
    cells.set(key, bucket);
  }
  return out;
}

/** Lo que viaja al mapa: id, lat, lon, icon. Sin descripción. Tope para no mandar el dump. */
export function thinClusterPins(pins: ShopPin[], max = 800): ShopPin[] {
  return pins.slice(0, max).map((p) => {
    const row: ShopPin = {
      id: p.id,
      lat: p.lat,
      lon: p.lon,
      icon: p.icon || "lugar",
    };
    if (p.name) row.name = p.name;
    if ((p.clusterCount ?? 0) > 1) row.clusterCount = p.clusterCount;
    else if (p.logo && p.icon !== "cluster") row.logo = p.logo;
    return row;
  });
}

export function loadShopIndex(shops: ShopPin[]) {
  const index = new Supercluster<ShopPointProps>({ radius: 48, maxZoom: 16, minPoints: 3 });
  index.load(
    uniqueShopPins(shops).map((s) => ({
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
  const seen = new Set<string>();
  const push = (pin: ShopPin) => {
    if (!pin.id || seen.has(pin.id)) return;
    seen.add(pin.id);
    out.push(pin);
  };
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
      // El número es solo lo que está en esta caja. Si falta alguno, o ya se lee la calle, van las fichas.
      const n = inView.length;
      const total = Number(p.point_count) || n;
      if (!n) continue;
      if (z >= 11 || n <= 12 || n < total) {
        for (const leaf of inView) {
          const [x, y] = leaf.geometry.coordinates;
          const prop = leaf.properties as ShopPointProps;
          if (!prop?.id) continue;
          push({ id: prop.id, lat: y, lon: x, icon: prop.icon || "lugar", name: prop.name || prop.id });
        }
        continue;
      }
      push({ id: `cluster:${cid}`, lat, lon, icon: "cluster", name: String(n), clusterCount: n });
      continue;
    }
    const leaf = p as ShopPointProps;
    push({ id: leaf.id, lat, lon, icon: leaf.icon || "lugar", name: leaf.name || leaf.id });
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