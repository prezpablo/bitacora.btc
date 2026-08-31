export type GlobeDot = { lat: number; lon: number; n: number; logo?: string };

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

export type GlobeFocus = { lat: number; lon: number; zoom: number; iso?: string };
