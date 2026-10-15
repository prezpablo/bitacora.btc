const KEY = Symbol.for("bitacora.cspNonce");

type Slot = { get: () => string };

function slot(): Slot {
  const g = globalThis as typeof globalThis & { [KEY]?: Slot };
  if (!g[KEY]) g[KEY] = { get: () => "" };
  return g[KEY];
}

/** Vacío en el navegador. En el servidor es el nonce de esta respuesta. */
export function cspNonce() {
  return slot().get();
}

export function bindCspNonce(get: () => string) {
  slot().get = get;
}
