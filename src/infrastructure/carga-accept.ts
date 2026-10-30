import { makePinToken, PIN_TTL_MS, type CommunityPin } from "@/domain/community-pins";
import { localShopId, slugifyName } from "@/domain/map-compose";
import { parseMapCsv, stringifyMapCsv, type MapCsvRow } from "@/domain/map-csv";
import { normalizeProofUrl } from "@/domain/verify";
import { consumeCaptchaTicket } from "./captcha-ticket";
import { recordConsent } from "./consent-log";
import { rewriteDataLogo } from "./logo-exif";
import { countPendingMapRows, loadMapCsvText, saveMapCsvText } from "./map-csv-io";
import { countPendingPins, loadPins, savePins } from "./pins-io";
import { atLimit, clientKey, tooMany } from "./rate-limit";
import { isPublicHttp } from "./safe-fetch";

const HOUR = 60 * 60_000;

export type CargaResult = { ok: boolean; id?: string; token?: string; error?: string };

export type MapCargaInput = {
  kind: "shop" | "community";
  name: string;
  slug?: string;
  description?: string;
  notes?: string;
  address?: string;
  logo?: string;
  lat: number;
  lon: number;
  socials?: string;
  hours?: string;
  pays?: string;
  captchaId?: string;
  captcha?: string;
  captchaNonce?: string;
  hp?: string;
  consent?: boolean;
  textVersion?: string;
  form?: string;
};

export type PinCargaInput = {
  name: string;
  blurb: string;
  proof?: string;
  links?: string[];
  captchaId?: string;
  captcha?: string;
  captchaNonce?: string;
  hp?: string;
  consent?: boolean;
  textVersion?: string;
  form?: string;
};

function safeHttp(raw: string) {
  let u = raw.trim();
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  if (!isPublicHttp(u)) return "";
  try {
    return new URL(u).toString();
  } catch {
    return "";
  }
}

async function storedLogo(raw: string) {
  const next = await rewriteDataLogo(raw);
  if (next.startsWith("data:")) return next.slice(0, 120_000);
  return next.slice(0, 500);
}

function noteConsent(form: string, ref: string, version: string) {
  try {
    recordConsent(form, ref, version);
  } catch {
    /* el alta no depende del log */
  }
}

/** Comercio o comunidad. El tope y el duplicado se miran antes de gastar el captcha. */
export async function acceptMapListing(data: MapCargaInput): Promise<CargaResult> {
  if ((data.hp || "").trim()) return { ok: true };
  if (data.consent !== true) return { ok: false, error: "consent" };
  const lat = Number(data.lat);
  const lon = Number(data.lon);
  const name = (data.name || "").trim().slice(0, 80);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return { ok: false, error: "need" };
  if (atLimit(clientKey("map-add"), 6, HOUR) || atLimit("map-add:global", 24, HOUR)) {
    return { ok: false, error: "rate" };
  }
  if ((await countPendingMapRows()) >= 80) return { ok: false, error: "rate" };
  const rows = parseMapCsv(await loadMapCsvText());
  let id = "";
  if (data.kind === "community") {
    const slug = slugifyName(data.slug || data.name);
    if (!slug) return { ok: false, error: "slug" };
    id = `c:${slug}`;
  } else {
    id = localShopId(lat, lon);
  }
  const existing = rows.find((r) => r.id === id);
  if (existing?.verifiedAt) return { ok: false, error: data.kind === "community" ? "slugTaken" : "need" };
  if (existing) return { ok: false, error: "pending" };
  if (!consumeCaptchaTicket(data.captchaId || "", data.captcha || "", data.hp || "", data.captchaNonce || "")) {
    return { ok: false, error: "captcha" };
  }
  if (tooMany(clientKey("map-add"), 6, HOUR) || tooMany("map-add:global", 24, HOUR)) {
    return { ok: false, error: "rate" };
  }
  const row: MapCsvRow = {
    id,
    tipo: data.kind === "community" ? "community" : "shop",
    name,
    lat,
    lon,
    address: (data.address || "").trim().slice(0, 160),
    description: (data.description || "").trim().slice(0, 500),
    notes: (data.notes || "").trim().slice(0, 280),
    score: 0,
    votes: 0,
    logo: await storedLogo(data.logo || ""),
    socials: (data.socials || "").trim().slice(0, 800),
    hours: (data.hours || "").replace(/\s+/g, "").slice(0, 200),
    pays: (data.pays || "").trim().slice(0, 80),
    created: Date.now(),
    token: makePinToken(),
    verifiedAt: 0,
  };
  const ok = await saveMapCsvText(stringifyMapCsv([...rows, row]));
  if (!ok) return { ok: false, error: "save" };
  const stored = parseMapCsv(await loadMapCsvText()).find((r) => r.id === row.id);
  if (!stored || stored.token !== row.token) return { ok: false, error: "save" };
  noteConsent(data.form || "", row.id, data.textVersion || "");
  return { ok: true, id: row.id, token: row.token };
}

/** Anuncio de la comunidad. Misma regla: sin captcha gastado si el tope ya está lleno. */
export async function acceptCommunityPin(data: PinCargaInput): Promise<CargaResult> {
  if ((data.hp || "").trim()) return { ok: true };
  if (data.consent !== true) return { ok: false, error: "consent" };
  const name = (data.name || "").trim().slice(0, 80);
  const blurb = (data.blurb || "").trim().slice(0, 220);
  if (!name) return { ok: false, error: "need" };
  let proof = "";
  if ((data.proof || "").trim()) {
    const n = normalizeProofUrl(data.proof || "");
    if ("error" in n) return { ok: false, error: n.error };
    proof = safeHttp(n.url);
    if (!proof) return { ok: false, error: "need" };
  }
  if (atLimit(clientKey("pin"), 8, HOUR) || atLimit("pin:global", 30, HOUR)) {
    return { ok: false, error: "rate" };
  }
  if ((await countPendingPins()) >= 80) return { ok: false, error: "rate" };
  if (!consumeCaptchaTicket(data.captchaId || "", data.captcha || "", data.hp || "", data.captchaNonce || "")) {
    return { ok: false, error: "captcha" };
  }
  if (tooMany(clientKey("pin"), 8, HOUR) || tooMany("pin:global", 30, HOUR)) {
    return { ok: false, error: "rate" };
  }
  const links = (data.links || []).map(safeHttp).filter(Boolean).slice(0, 6);
  const pin: CommunityPin = {
    id: `pin:${Date.now().toString(36)}`,
    name,
    blurb,
    proof,
    links,
    token: makePinToken(),
    verified: false,
    verifiedAt: 0,
    created: Date.now(),
  };
  const fresh = (await loadPins()).filter((p) => Date.now() - p.created < 40 * PIN_TTL_MS);
  try {
    await savePins([...fresh, pin]);
  } catch {
    return { ok: false, error: "save" };
  }
  noteConsent(data.form || "", pin.id, data.textVersion || "");
  return { ok: true, token: pin.token, id: pin.id };
}
