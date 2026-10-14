/** 3G / Save-Data: encuestas más lentas. No elige el globo ni el mapa. */

type Conn = { saveData?: boolean; effectiveType?: string; addEventListener?: (t: string, fn: () => void) => void; removeEventListener?: (t: string, fn: () => void) => void };

function conn(): Conn | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: Conn; mozConnection?: Conn }).connection
    || (navigator as Navigator & { mozConnection?: Conn }).mozConnection;
}

export function slowNet() {
  const c = conn();
  if (!c) return false;
  if (c.saveData) return true;
  const t = c.effectiveType || "";
  return t === "slow-2g" || t === "2g" || t === "3g";
}

/** Antialias off only on a slow link and a screen that is not retina. Pins stay HTML, not pointsMerge. */
export function globeAntialias(slow: boolean, dpr: number) {
  return !(slow && dpr <= 2);
}
