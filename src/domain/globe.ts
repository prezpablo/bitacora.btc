export type GlobeDot = {
  lat: number;
  lon: number;
  n: number;
  logo?: string;
  id?: string;
  name?: string;
  kind?: "shop" | "community";
};

/** Consciencia Bitcoin — inland of Colonia so the ₿ sits on UY, not the river. */
export const FOUNDING_UY = {
  id: "c:cc-btc",
  slug: "cc-btc",
  name: "Consciencia Bitcoin",
  lat: -34.451,
  lon: -57.812,
  logo: "/logos/conciencia-bitcoin.png",
};

export type GlobeTally = { shops: number; comms: number; events: number; cities: number };

export type GlobeCountryStat = {
  iso: string;
  lat: number;
  lon: number;
  shops: number;
  comms: number;
  events: number;
  cities: number;
};

export type GlobeStats = {
  world: GlobeTally;
  latam: GlobeTally;
  countries: GlobeCountryStat[];
  points: GlobeDot[];
  overlay: GlobeDot[];
  asOf: number;
};

export const EMPTY_TALLY: GlobeTally = { shops: 0, comms: 0, events: 0, cities: 0 };

/** ISO 3166-1 alpha-2 del recorte Bitácora (Latam + Caribe hispano/lusófono). */
export const LATAM_ISO = new Set([
  "AR",
  "BO",
  "BR",
  "BZ",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "SV",
  "GT",
  "GY",
  "HN",
  "HT",
  "MX",
  "NI",
  "PA",
  "PE",
  "PR",
  "PY",
  "SR",
  "UY",
  "VE",
]);

export function tallyCountries(rows: GlobeCountryStat[], iso?: Set<string>): GlobeTally {
  const out: GlobeTally = { shops: 0, comms: 0, events: 0, cities: 0 };
  for (const c of rows) {
    if (iso && !iso.has(c.iso)) continue;
    out.shops += c.shops;
    out.comms += c.comms;
    out.events += c.events;
    out.cities += c.cities;
  }
  return out;
}

/** Total del calendario (con o sin ISO). Latam = código en LATAM_ISO. */
export function tallyEvents(rows: { countryCode?: string }[]): { world: number; latam: number } {
  let world = 0;
  let latam = 0;
  for (const e of rows) {
    world += 1;
    const iso = (e.countryCode || "").toUpperCase();
    if (LATAM_ISO.has(iso)) latam += 1;
  }
  return { world, latam };
}

export type GlobeFocus = { lat: number; lon: number; zoom: number; iso?: string; id?: string; kind?: "shop" | "community"; join?: boolean };
