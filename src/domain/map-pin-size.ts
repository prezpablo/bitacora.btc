/**
 * Tamaño del ₿ / logo en mapa y globo.
 * Lejos = punto; cerca = moneda chica. Nunca un sticker.
 */

export type MapPinKind = "shop" | "community" | "city";

export function coinPinSize(zoom: number, kind: MapPinKind = "shop", selected = false): number {
  const z = Number.isFinite(zoom) ? zoom : 4;
  let base = 10;
  if (z >= 16) base = 20;
  else if (z >= 14) base = 18;
  else if (z >= 12) base = 16;
  else if (z >= 10) base = 14;
  else if (z >= 8) base = 13;
  else if (z >= 6) base = 12;
  else if (z >= 4) base = 11;
  if (kind === "community") base += 2;
  else if (kind === "city") base += 1;
  if (selected) base += 3;
  return Math.min(24, Math.max(10, base));
}

/** Altitud del globo: ~2.35 mundo, ~0.5 país. */
export function globeCoinSize(altitude: number, founding = false): number {
  const a = Number.isFinite(altitude) ? altitude : 2.35;
  let px = 10;
  if (a <= 0.7) px = 16;
  else if (a <= 1.05) px = 14;
  else if (a <= 1.48) px = 12;
  else if (a <= 2.0) px = 11;
  if (founding) px += 2;
  return px;
}

export function pinBadgeSize(pinPx: number): number {
  return Math.max(8, Math.round(pinPx * 0.42));
}
