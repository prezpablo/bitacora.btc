/** 3G / Save-Data: skip the 1.8 MB globe and slow down live polls. */

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
