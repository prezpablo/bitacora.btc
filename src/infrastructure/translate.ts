import type { PulsePayload } from "@/domain/entities";

const TTL_OK = 24 * 60 * 60_000;
const TTL_FAIL = 20_000;
const cache = new Map<string, { at: number; text: string; from: string; ok: boolean }>();
const inflight = new Map<string, Promise<TranslateResult>>();

const LANG_OK = new Set(["en", "es", "pt", "fr", "de", "it", "nl", "pl", "ru", "ja", "zh", "ko", "ar", "tr"]);

export type TranslateResult = {
  text: string;
  from: string;
  ok: boolean;
  provider?: "mymemory" | "google" | "lingva";
};

export function localeOf(raw?: string) {
  const l = (raw || "es").slice(0, 2).toLowerCase();
  return LANG_OK.has(l) ? l : "es";
}

export function detectLang(text: string): string {
  const t = text.toLowerCase();
  const esHits = (t.match(/\b(el|la|los|las|del|por|para|una|que|con)\b/g) || []).length;
  const ptHits = (t.match(/\b(não|são|ção|ões|uma|para os)\b/g) || []).length;
  if (/[ñ¿¡]/.test(t) || esHits >= 3) return "es";
  if (/[ãõ]/.test(t) || ptHits >= 2) return "pt";
  return "en";
}

export async function mapPool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, Math.max(items.length, 0)) }, () => worker()));
  return out;
}

class ApiError extends Error {
  kind: "http" | "abort" | "network" | "empty" | "quota";
  status: number;
  constructor(kind: "http" | "abort" | "network" | "empty" | "quota", status = 0) {
    super(kind === "http" ? `http ${status}` : kind);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

function asApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (typeof DOMException !== "undefined" && err instanceof DOMException && err.name === "AbortError") {
    return new ApiError("abort");
  }
  if (err instanceof Error && /abort/i.test(err.message)) return new ApiError("abort");
  const status = Number((err as Error)?.message);
  if (status === 429) return new ApiError("quota", 429);
  if (status >= 400 && status < 500) return new ApiError("http", status);
  if (status >= 500) return new ApiError("http", status);
  return new ApiError("network");
}

function canRetry(err: ApiError) {
  return err.kind === "network" || (err.kind === "http" && err.status >= 500);
}

const health = new Map<string, { fails: number; until: number }>();

function open(name: string) {
  const h = health.get(name);
  return Boolean(h && Date.now() < h.until);
}

function markOk(name: string) {
  health.delete(name);
}

function markFail(name: string, hard = false) {
  const prev = health.get(name);
  const fails = hard ? 3 : (prev?.fails ?? 0) + 1;
  const cool = hard ? 10 * 60_000 : 2 * 60_000;
  health.set(name, { fails, until: fails >= 3 ? Date.now() + cool : 0 });
}

async function sleep(ms: number, signal: AbortSignal) {
  if (signal.aborted) throw new ApiError("abort");
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new ApiError("abort"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function readJson(url: string, signal: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(url, {
      signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw asApiError(err);
  }
  if (res.status === 429) throw new ApiError("quota", 429);
  if (!res.ok) throw new ApiError("http", res.status);
  try {
    return await res.json();
  } catch {
    throw new ApiError("empty");
  }
}

async function once<T>(fn: () => Promise<T>, signal: AbortSignal): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const e = asApiError(err);
    if (!canRetry(e) || signal.aborted) throw e;
    await sleep(280, signal);
    return await fn();
  }
}

function joinSentences(chunks: unknown): string {
  if (!Array.isArray(chunks)) return "";
  return chunks
    .map((row) => (Array.isArray(row) && typeof row[0] === "string" ? row[0] : ""))
    .join("")
    .trim();
}

async function googleGtx(text: string, from: string, to: string, signal: AbortSignal) {
  const q = encodeURIComponent(text.slice(0, 900));
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${q}`;
  const j = await readJson(url, signal);
  const out = joinSentences(j?.[0]);
  if (!out) throw new ApiError("empty");
  const detected = typeof j?.[2] === "string" ? j[2].slice(0, 2).toLowerCase() : from;
  return { text: out, from: LANG_OK.has(detected) ? detected : from, ok: true as const, provider: "google" as const };
}

async function myMemory(text: string, from: string, to: string, signal: AbortSignal) {
  const q = encodeURIComponent(text.slice(0, 500));
  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=${from}|${to}`;
  const j = (await readJson(url, signal)) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
  };
  const out = j.responseData?.translatedText?.trim();
  if (j.responseStatus === 429 || /quota|limit/i.test(out ?? "")) throw new ApiError("quota", 429);
  if (j.responseStatus !== 200 || !out || /invalid/i.test(out) || /myMEMORY/i.test(out)) throw new ApiError("empty");
  return { text: out, from, ok: true as const, provider: "mymemory" as const };
}

async function lingva(text: string, from: string, to: string, signal: AbortSignal) {
  const q = encodeURIComponent(text.slice(0, 700));
  const url = `https://lingva.ml/api/v1/${from}/${to}/${q}`;
  const j = (await readJson(url, signal)) as { translation?: string };
  const out = j.translation?.trim();
  if (!out) throw new ApiError("empty");
  return { text: out, from, ok: true as const, provider: "lingva" as const };
}

const PROVIDERS: {
  name: "mymemory" | "google" | "lingva";
  run: (text: string, from: string, to: string, signal: AbortSignal) => Promise<TranslateResult>;
}[] = [
  { name: "google", run: googleGtx },
  { name: "mymemory", run: myMemory },
  { name: "lingva", run: lingva },
];

async function savedTr(url: string, lang: string, src: string) {
  try {
    const { openSqlite } = await import("./sqlite.ts");
    const row = openSqlite()
      .prepare("SELECT text, from_lang, at FROM tr_cache WHERE url = ? AND lang = ? AND src = ?")
      .get(url, lang, src);
    if (!row) return null;
    const at = Number(row.at);
    if (!Number.isFinite(at) || Date.now() - at >= TTL_OK) return null;
    return { text: String(row.text || ""), from: String(row.from_lang || ""), at };
  } catch {
    return null;
  }
}

async function saveTr(url: string, lang: string, src: string, text: string, from: string) {
  try {
    const { openSqlite } = await import("./sqlite.ts");
    const db = openSqlite();
    db.prepare(
      "INSERT INTO tr_cache(url, lang, src, text, from_lang, at) VALUES(?,?,?,?,?,?) ON CONFLICT(url, lang, src) DO UPDATE SET text = excluded.text, from_lang = excluded.from_lang, at = excluded.at",
    ).run(url, lang, src, text, from, Date.now());
    if (Math.random() < 0.02) {
      db.prepare("DELETE FROM tr_cache WHERE at < ?").run(Date.now() - TTL_OK);
    }
  } catch {
    /* sqlite optional */
  }
}

/** Traduce con API. Nunca lanza: si todo falla, devuelve el original. */
export async function translateAuto(
  text: string,
  to: string,
  signal: AbortSignal,
  url = "",
): Promise<TranslateResult> {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return { text: "", from: to, ok: true };
  const from = detectLang(trimmed);
  if (from === to) return { text: trimmed, from, ok: true };
  const page = url.slice(0, 500);
  const key = `${from}|${to}|${page}|${trimmed}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < (hit.ok ? TTL_OK : TTL_FAIL)) {
    return { text: hit.text, from: hit.from, ok: hit.ok };
  }
  const disk = await savedTr(page, to, trimmed);
  if (disk?.text) {
    cache.set(key, { at: disk.at, text: disk.text, from: disk.from || from, ok: true });
    return { text: disk.text, from: disk.from || from, ok: true };
  }
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = (async (): Promise<TranslateResult> => {
    for (const p of PROVIDERS) {
      if (open(p.name) || signal.aborted) {
        if (signal.aborted) break;
        continue;
      }
      const ctrl = new AbortController();
      const onAbort = () => ctrl.abort();
      if (signal.aborted) break;
      signal.addEventListener("abort", onAbort, { once: true });
      const timer = setTimeout(() => ctrl.abort(), 4_000);
      try {
        const result = await once(() => p.run(trimmed, from, to, ctrl.signal), ctrl.signal);
        markOk(p.name);
        const at = Date.now();
        cache.set(key, { at, text: result.text, from: result.from, ok: true });
        await saveTr(page, to, trimmed, result.text, result.from);
        return result;
      } catch (err) {
        const e = asApiError(err);
        if (e.kind === "abort" && signal.aborted) break;
        markFail(p.name, e.kind === "quota" || e.kind === "network");
      } finally {
        clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
      }
    }
    const fallback: TranslateResult = { text: trimmed, from, ok: false };
    cache.set(key, { at: Date.now(), text: trimmed, from, ok: false });
    return fallback;
  })().finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}

export async function translateNews(news: PulsePayload["news"], to: string, signal: AbortSignal) {
  let ok = 0;
  let fail = 0;
  const rows = await mapPool(news, 3, async (item) => {
    const originalTitle = item.originalTitle ?? item.title;
    const originalSummary = item.originalSummary ?? item.summary;
    const [titleTr, sumTr] = await Promise.all([
      translateAuto(originalTitle, to, signal, item.url || ""),
      originalSummary ? translateAuto(originalSummary, to, signal, item.url || "") : Promise.resolve(null),
    ]);
    const worked = titleTr.ok && (sumTr ? sumTr.ok : true);
    if (worked) ok += 1;
    else fail += 1;
    const from = titleTr.from || "en";
    return {
      ...item,
      originalTitle,
      originalSummary,
      title: titleTr.text || originalTitle,
      summary: sumTr?.text || originalSummary,
      sourceLang: from.toUpperCase(),
    };
  });
  const status = fail === 0 ? "ok" : ok === 0 ? "off" : "partial";
  return { rows, status } as const;
}

export async function translateFeed(
  posts: { id: string; title: string; body: string; url?: string }[],
  to: string,
  signal: AbortSignal,
) {
  let ok = 0;
  let fail = 0;
  const rows = await mapPool(posts, 3, async (item) => {
    const [titleTr, bodyTr] = await Promise.all([
      translateAuto(item.title, to, signal, item.url || ""),
      item.body ? translateAuto(item.body, to, signal, item.url || "") : Promise.resolve(null),
    ]);
    const worked = titleTr.ok && (bodyTr ? bodyTr.ok : true);
    if (worked) ok += 1;
    else fail += 1;
    return {
      ...item,
      title: titleTr.text || item.title,
      body: bodyTr?.text || item.body,
    };
  });
  const status = fail === 0 ? "ok" : ok === 0 ? "off" : "partial";
  return { rows, status } as const;
}
