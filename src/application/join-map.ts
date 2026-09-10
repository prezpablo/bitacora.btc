/** Pedido de Sumate (header o globo). El mapa se suscribe; el header no conoce Leaflet. */

type JoinFn = () => void;

const KEY = "bitacora-join";
const subs = new Set<JoinFn>();

export function requestJoinMap() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* privado / SSR */
  }
  for (const fn of [...subs]) fn();
}

export function onJoinMap(fn: JoinFn) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function takeJoinIntent() {
  try {
    if (sessionStorage.getItem(KEY) === "1") {
      sessionStorage.removeItem(KEY);
      return true;
    }
  } catch {
    /* privado / SSR */
  }
  return false;
}
