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
  world: { shops: number; comms: number; events: number; cities: number };
  countries: GlobeCountryStat[];
  points: GlobeDot[];
  overlay: GlobeDot[];
  asOf: number;
};

export type GlobeFocus = { lat: number; lon: number; zoom: number; iso?: string; id?: string; kind?: "shop" | "community"; join?: boolean };
