/** Bandas de un ejemplo, no un punto de equilibrio real. */
export type MineLightTone = "room" | "thin" | "eats";

export function mineLightTone(cents: number): MineLightTone {
  const n = Math.round(cents);
  if (n <= 6) return "room";
  if (n <= 9) return "thin";
  return "eats";
}
