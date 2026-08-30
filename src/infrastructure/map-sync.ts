import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import type { Community, MerchantLocal } from "@/domain";

function env(name: string) {
  return String((import.meta.env as Record<string, string | undefined>)[name] || "").trim();
}

export function firebaseConfigured() {
  return Boolean(env("VITE_FIREBASE_API_KEY") && env("VITE_FIREBASE_PROJECT_ID"));
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let authed: Promise<void> | null = null;

function boot() {
  if (!firebaseConfigured()) return null;
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        apiKey: env("VITE_FIREBASE_API_KEY"),
        authDomain: env("VITE_FIREBASE_AUTH_DOMAIN") || `${env("VITE_FIREBASE_PROJECT_ID")}.firebaseapp.com`,
        projectId: env("VITE_FIREBASE_PROJECT_ID"),
        storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET") || `${env("VITE_FIREBASE_PROJECT_ID")}.appspot.com`,
        messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID"),
        appId: env("VITE_FIREBASE_APP_ID"),
      });
    db = getFirestore(app);
    auth = getAuth(app);
  }
  return { app, db: db!, auth: auth! };
}

function ensureAuth() {
  const b = boot();
  if (!b) return Promise.resolve();
  if (!authed) {
    authed = signInAnonymously(b.auth).then(() => undefined).catch((err) => {
      authed = null;
      throw err;
    });
  }
  return authed;
}

function plain<T>(row: T): T {
  return JSON.parse(JSON.stringify(row)) as T;
}

function docId(id: string) {
  return id.replace(/\//g, "_").slice(0, 700);
}

export function mergeLocals(a: MerchantLocal, b: MerchantLocal): MerchantLocal {
  const votes = new Map<string, MerchantLocal["votes"][number]>();
  for (const v of [...(a.votes || []), ...(b.votes || [])]) {
    const prev = votes.get(v.by);
    if (!prev || v.at >= prev.at) votes.set(v.by, v);
  }
  const newer = (b.updatedAt || b.listedAt || 0) >= (a.updatedAt || a.listedAt || 0) ? b : a;
  const older = newer === b ? a : b;
  return {
    ...older,
    ...newer,
    votes: [...votes.values()],
    listedAt: Math.min(a.listedAt || Date.now(), b.listedAt || Date.now()),
    removed: Boolean(a.removed || b.removed),
    logo: newer.logo || older.logo,
    hours: newer.hours || older.hours,
    pays: newer.pays || older.pays,
    links: newer.links?.length ? newer.links : older.links,
  };
}

export function mergeStores(local: Record<string, MerchantLocal>, remote: Record<string, MerchantLocal>) {
  const out = { ...local };
  for (const [id, row] of Object.entries(remote)) {
    out[id] = out[id] ? mergeLocals(out[id]!, row) : row;
  }
  return out;
}

export function mergeCommunities(local: Community[], remote: Community[]) {
  const map = new Map<string, Community>();
  for (const c of [...local, ...remote]) {
    const prev = map.get(c.id);
    if (!prev) {
      map.set(c.id, c);
      continue;
    }
    const votes = new Map<string, NonNullable<Community["votes"]>[number]>();
    for (const v of [...(prev.votes || []), ...(c.votes || [])]) {
      const last = votes.get(v.by);
      if (!last || v.at >= last.at) votes.set(v.by, v);
    }
    const newer = (c.createdAt || 0) >= (prev.createdAt || 0) ? c : prev;
    map.set(c.id, { ...prev, ...newer, votes: [...votes.values()] });
  }
  return [...map.values()];
}

export function listenPlaces(onData: (rows: Record<string, MerchantLocal>) => void) {
  const b = boot();
  if (!b) return () => {};
  void ensureAuth().catch(() => undefined);
  return onSnapshot(
    collection(b.db, "places"),
    (snap) => {
      const rows: Record<string, MerchantLocal> = {};
      snap.forEach((d) => {
        rows[d.id] = d.data() as MerchantLocal;
      });
      onData(rows);
    },
    () => undefined,
  );
}

export function listenCommunities(onData: (rows: Community[]) => void) {
  const b = boot();
  if (!b) return () => {};
  void ensureAuth().catch(() => undefined);
  return onSnapshot(
    collection(b.db, "communities"),
    (snap) => {
      onData(snap.docs.map((d) => d.data() as Community));
    },
    () => undefined,
  );
}

export async function upsertPlace(id: string, row: MerchantLocal) {
  const b = boot();
  if (!b) return false;
  await ensureAuth();
  const safe = plain({ ...row, updatedAt: Date.now() });
  if ((safe.logo?.length || 0) > 700_000) delete safe.logo;
  await setDoc(doc(b.db, "places", docId(id)), { ...safe, id }, { merge: true });
  return true;
}

export async function upsertCommunity(row: Community) {
  const b = boot();
  if (!b) return false;
  await ensureAuth();
  const safe = plain({ ...row });
  if ((safe.logo?.length || 0) > 700_000) safe.logo = "";
  await setDoc(doc(b.db, "communities", docId(row.id)), safe, { merge: true });
  return true;
}
