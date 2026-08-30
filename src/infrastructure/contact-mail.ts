import { resolveMx } from "node:dns/promises";
import { appendFile, mkdir } from "node:fs/promises";

const INBOX = "data/contact-inbox.jsonl";
const SUBJECT = "Contacto Bitacora";
const DEST = "latamcriptomom@gmail.com";
const FROM_NAME = "Bitácora.btc";

export const MAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export async function mailboxDomainOk(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  try {
    const mx = await resolveMx(domain);
    return mx.some((r) => r.exchange);
  } catch {
    return false;
  }
}

export type ContactPayload = { name: string; email: string; message: string; topic?: string; auto?: string };

export async function persistContact(p: ContactPayload) {
  try {
    await mkdir("data", { recursive: true });
    const { auto: _a, ...rest } = p;
    await appendFile(INBOX, JSON.stringify({ at: new Date().toISOString(), ...rest, subject: SUBJECT }) + "\n", "utf8");
  } catch {
    /* disk optional */
  }
}

export function contactRelay(): { url: string; subject: string } {
  return { url: `https://formsubmit.co/${DEST}`, subject: SUBJECT };
}

export function ackRelay(email: string): { url: string; subject: string } {
  return { url: `https://formsubmit.co/${email}`, subject: `${FROM_NAME}` };
}

async function postSubmit(dest: string, fields: Record<string, string>): Promise<"ok" | "activate" | "fail"> {
  if (!MAIL_RE.test(dest)) return "fail";
  const body = new URLSearchParams({ ...fields, _captcha: "false", _template: fields._template || "table" });
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${dest}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(12_000),
    });
    const raw = await res.text();
    let json: { success?: string | boolean; message?: string } = {};
    try {
      json = JSON.parse(raw) as typeof json;
    } catch {
      json = { message: raw };
    }
    const msg = String(json.message || raw || "");
    if (/activ|confirm/i.test(msg)) return "activate";
    if (res.ok && (json.success === true || json.success === "true")) return "ok";
    return "fail";
  } catch {
    return "fail";
  }
}

export function forwardFormSubmit(p: ContactPayload) {
  return postSubmit(DEST, {
    name: p.name,
    email: p.email,
    message: p.message,
    topic: p.topic || "general",
    _subject: `${SUBJECT}${p.topic ? ` · ${p.topic}` : ""}`,
    _replyto: p.email,
  });
}

/** Acuse al emisor: FormSubmit no dispara _autoresponse si _captcha=false. */
export function forwardAck(p: ContactPayload) {
  const body = (p.auto || "").trim() || `Hola ${p.name}:\n\nRecibimos tu mensaje en Bitácora.btc.\n\nIniciativa Bitacora.btc\nConsciencia Bitcoin by Latam Cripto Mom`;
  return postSubmit(p.email, {
    name: FROM_NAME,
    email: p.email,
    message: body,
    _subject: `${FROM_NAME} · recibimos tu mensaje`,
    _replyto: p.email,
    _template: "box",
  });
}
