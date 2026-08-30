const FLAG = "bitacora-storage";
const EXTRA = ["bitacora-nick", "bitacora-map-csv-v1", "bitacora-places-v1", "bitacora-communities-v1"];

export function storageChoice(): "unset" | "min" | "ok" {
  if (typeof window === "undefined") return "unset";
  const v = window.localStorage.getItem(FLAG);
  if (v === "ok" || v === "min") return v;
  return "unset";
}

export function extrasAllowed() {
  return storageChoice() === "ok";
}

export function setStorageChoice(v: "min" | "ok") {
  window.localStorage.setItem(FLAG, v);
  if (v === "min") wipeExtras();
}

export function wipeExtras() {
  if (typeof window === "undefined") return;
  for (const k of EXTRA) window.localStorage.removeItem(k);
}

export function readExtra(key: string, fallback: string) {
  if (!extrasAllowed()) return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function writeExtra(key: string, value: string) {
  if (!extrasAllowed()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota */
  }
}
