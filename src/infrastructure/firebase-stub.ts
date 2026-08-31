/** Stub: el bundle de producción no lleva Firebase si no hay claves VITE_FIREBASE_*. */

export function initializeApp() {
  return { name: "stub" };
}
export function getApps() {
  return [];
}
export function getAuth() {
  return { app: { name: "stub" } };
}
export function signInAnonymously() {
  return Promise.resolve({ user: null });
}
export function getFirestore() {
  return { app: { name: "stub" } };
}
export function collection() {
  return {};
}
export function doc() {
  return {};
}
export function onSnapshot() {
  return () => {};
}
export function setDoc() {
  return Promise.resolve();
}
