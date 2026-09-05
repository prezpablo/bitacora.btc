/** Recuadro de mapa y fix. Puro: sin fetch ni GPS. */

export type GeoFix = {
  lat: number;
  lon: number;
  accuracy: number;
  city?: string;
  country?: string;
  countryCode?: string;
  source: "gps" | "ip" | "tap";
};

export type CityFrame = {
  lat: number;
  lon: number;
  south: number;
  north: number;
  west: number;
  east: number;
  label: string;
  country?: string;
  countryCode?: string;
};

export function boxAround(lat: number, lon: number, label = "ciudad", span = 0.14): CityFrame {
  return {
    lat,
    lon,
    south: lat - span,
    north: lat + span,
    west: lon - span * 1.25,
    east: lon + span * 1.25,
    label,
  };
}

/** Recuadro chico alrededor del fix GPS para no abrir un departamento entero (Colonia ≠ Montevideo). */
export function frameFromFix(fix: GeoFix, label?: string): CityFrame {
  const km = Math.min(Math.max(fix.accuracy / 1000, 1.2), 8);
  const span = km / 111;
  return boxAround(fix.lat, fix.lon, label || fix.city || "acá", span);
}
