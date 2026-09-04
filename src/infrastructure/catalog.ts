import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Community, MerchantPlace } from "@/domain";
import type { SocialLink } from "@/domain/socials";
import { metaSet, openSqlite, sqlTx } from "./sqlite.ts";

function seedFiles(name: string) {
  return [
    join(process.cwd(), "public", "data", name),
    join(process.cwd(), ".output", "public", "data", name),
    join(process.cwd(), "data", name),
  ];
}

function readSeed<T>(name: string): T[] {
  for (const path of seedFiles(name)) {
    try {
      const rows = JSON.parse(readFileSync(path, "utf8")) as T[];
      if (Array.isArray(rows) && rows.length) return rows;
    } catch {
      /* next path */
    }
  }
  return [];
}

function asShop(row: Record<string, unknown>): MerchantPlace {
  return {
    id: String(row.id || ""),
    lat: Number(row.lat),
    lon: Number(row.lon),
    name: String(row.name || row.id || ""),
    category: String(row.category || "lugar"),
    createdAt: Number(row.created) || Date.now(),
    logo: String(row.logo || "") || undefined,
    description: String(row.description || "") || undefined,
  };
}

function asComm(row: Record<string, unknown>): Community {
  let links: SocialLink[] = [];
  try {
    const raw = String(row.socials || "");
    if (raw.startsWith("[")) links = JSON.parse(raw) as SocialLink[];
  } catch {
    links = [];
  }
  const id = String(row.id || "");
  return {
    id,
    slug: String(row.category || id.replace(/^btcmap:/, "")),
    name: String(row.name || id),
    lat: Number(row.lat),
    lon: Number(row.lon),
    logo: String(row.logo || "") || undefined,
    description: String(row.description || "") || undefined,
    links,
    createdAt: Number(row.created) || 0,
  };
}

export function catalogCount() {
  try {
    const row = openSqlite().prepare("SELECT COUNT(*) AS n FROM catalog").get();
    return Number(row?.n) || 0;
  } catch {
    return 0;
  }
}

export function replaceCatalog(shops: MerchantPlace[], comms: Community[], wipe = true) {
  sqlTx((d) => {
    if (wipe) d.exec("DELETE FROM catalog WHERE source = 'btcmap'");
    const ins = d.prepare(
      `INSERT INTO catalog(id, tipo, name, lat, lon, category, logo, description, socials, created, source)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, lat=excluded.lat, lon=excluded.lon, category=excluded.category,
         logo=CASE WHEN excluded.logo != '' THEN excluded.logo ELSE catalog.logo END,
         description=CASE WHEN excluded.description != '' THEN excluded.description ELSE catalog.description END,
         socials=CASE WHEN excluded.socials != '' THEN excluded.socials ELSE catalog.socials END,
         created=excluded.created`,
    );
    for (const p of shops) {
      if (!p.id || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
      ins.run(p.id, "shop", p.name || p.id, p.lat, p.lon, p.category || "", p.logo || "", p.description || "", "", p.createdAt || 0, "btcmap");
    }
    for (const c of comms) {
      if (!c.id || !Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;
      ins.run(
        c.id,
        "community",
        c.name || c.id,
        c.lat,
        c.lon,
        c.slug || "",
        c.logo || "",
        c.description || "",
        JSON.stringify(c.links || []),
        c.createdAt || 0,
        "btcmap",
      );
    }
    metaSet("catalog_at", String(Date.now()));
    metaSet("catalog_n", String(shops.length + comms.length));
  });
}

export function ensureCatalog() {
  if (catalogCount() >= 50) return;
  const shops = readSeed<MerchantPlace>("btcmap-shops.json");
  const comms = readSeed<Community>("btcmap-comms.json");
  if (!shops.length && !comms.length) return;
  replaceCatalog(shops, comms, false);
}

export function catalogShopsInBox(b: { west: number; south: number; east: number; north: number }): MerchantPlace[] {
  ensureCatalog();
  try {
    const rows = openSqlite()
      .prepare(
        `SELECT id, name, lat, lon, category, logo, description, created FROM catalog
         WHERE tipo = 'shop' AND lon >= ? AND lon <= ? AND lat >= ? AND lat <= ? LIMIT 800`,
      )
      .all(b.west, b.east, b.south, b.north);
    return rows.map(asShop).filter((p) => p.id);
  } catch {
    return [];
  }
}

export function catalogAllShops(): MerchantPlace[] {
  ensureCatalog();
  try {
    return openSqlite()
      .prepare("SELECT id, name, lat, lon, category, logo, description, created FROM catalog WHERE tipo = 'shop'")
      .all()
      .map(asShop)
      .filter((p) => p.id);
  } catch {
    return [];
  }
}

export function catalogCommunities(): Community[] {
  ensureCatalog();
  try {
    return openSqlite()
      .prepare("SELECT id, name, lat, lon, category, logo, description, socials, created FROM catalog WHERE tipo = 'community'")
      .all()
      .map(asComm)
      .filter((c) => c.id);
  } catch {
    return [];
  }
}

export function searchCatalogShops(needle: string, limit = 8): MerchantPlace[] {
  ensureCatalog();
  const q = `%${needle.toLowerCase()}%`;
  try {
    return openSqlite()
      .prepare(
        `SELECT id, name, lat, lon, category, logo, description, created FROM catalog
         WHERE tipo = 'shop' AND (lower(name) LIKE ? OR lower(category) LIKE ?) LIMIT ?`,
      )
      .all(q, q, limit)
      .map(asShop)
      .filter((p) => p.id);
  } catch {
    return [];
  }
}
