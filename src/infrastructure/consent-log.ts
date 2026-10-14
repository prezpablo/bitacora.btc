import { hashClientIp, peerFromHeaders } from "./rate-limit.ts";
import { purgeRetentionIfDue } from "./retention.ts";
import { openSqlite } from "./sqlite.ts";
import { getRequest } from "@tanstack/react-start/server";

/** Misma cifra que LEGAL.consentVersion. No importar el módulo: el test corre sin el alias de Vite. */
export const CONSENT_VERSION = "2.14";

export type ConsentKind = "contact" | "shop" | "community" | "pin" | "experience" | "patch" | "publish" | "";

const FORMS = new Set(["contact", "shop", "community", "pin", "experience", "patch"]);

/** Solo una versión corta y un formulario de la lista. Lo demás queda vacío: no se inventa. */
export function readSentConsent(raw: { textVersion?: string; form?: string }) {
  const version = (raw.textVersion || "").trim();
  const form = (raw.form || "").trim();
  return {
    version: /^\d+\.\d+$/.test(version) ? version.slice(0, 16) : "",
    form: FORMS.has(form) ? form : "",
  };
}

export type ConsentRow = {
  kind: ConsentKind;
  version: string;
  ipHash: string;
  ref: string;
  created: number;
};

/** Un hash no es una IP. Si alguien pasa la IP en claro, no se guarda. */
export function safeIpHash(raw: string) {
  const s = raw.trim();
  if (!s || s.includes(".") || s.includes(":") || /\s/.test(s)) return "";
  return s.slice(0, 64);
}

export function writeConsent(row: ConsentRow) {
  const ipHash = safeIpHash(row.ipHash);
  openSqlite()
    .prepare("INSERT INTO consent_log(kind, version, ip_hash, ref, created) VALUES(?,?,?,?,?)")
    .run(row.kind, row.version.slice(0, 16), ipHash, row.ref.slice(0, 80), row.created);
}

export function recordConsent(form: string, ref: string, version: string) {
  const sent = readSentConsent({ textVersion: version, form });
  let ipHash = "";
  try {
    const req = getRequest();
    ipHash = hashClientIp(peerFromHeaders(req.headers));
  } catch {
    ipHash = "";
  }
  writeConsent({ kind: sent.form as ConsentKind, version: sent.version, ipHash, ref, created: Date.now() });
  try {
    purgeRetentionIfDue();
  } catch {
    /* el timer sigue siendo la vía */
  }
}

export function listConsent() {
  return openSqlite()
    .prepare("SELECT kind, version, ip_hash, ref, created FROM consent_log ORDER BY id")
    .all()
    .map((r) => ({
      kind: String(r.kind || ""),
      version: String(r.version || ""),
      ipHash: String(r.ip_hash || ""),
      ref: String(r.ref || ""),
      created: Number(r.created) || 0,
    }));
}
