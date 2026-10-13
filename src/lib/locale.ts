import { create } from "zustand";

export const LANGS = [
  { value: "es" as const, label: "Español", short: "ES" },
  { value: "pt" as const, label: "Português", short: "PT" },
  { value: "en" as const, label: "English", short: "EN" },
];

export type AppLang = (typeof LANGS)[number]["value"];

export function langFromQuery(raw?: unknown): AppLang | null {
  let q: string | null = null;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (s === "es" || s === "en" || s === "pt") return s;
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) {
      try {
        q = new URL(s, "https://bitacorabtc.org").searchParams.get("lang");
      } catch {
        q = null;
      }
    } else {
      const params = new URLSearchParams(s.startsWith("?") ? s : s.includes("=") ? s : "");
      q = params.get("lang");
    }
  } else if (typeof URLSearchParams !== "undefined" && raw instanceof URLSearchParams) {
    q = raw.get("lang");
  } else if (raw && typeof raw === "object") {
    const v = "lang" in raw ? (raw as { lang?: unknown }).lang : null;
    if (Array.isArray(v)) q = String(v[0] ?? "");
    else if (typeof v === "string") q = v;
  }
  const l = (q || "").slice(0, 2).toLowerCase();
  return l === "es" || l === "en" || l === "pt" ? l : null;
}

export function langFromLocation(location: {
  search?: unknown;
  searchStr?: string;
  href?: string;
  url?: string;
}): AppLang {
  return (
    langFromQuery(location.search) ||
    langFromQuery(location.searchStr) ||
    langFromQuery(location.href) ||
    langFromQuery(location.url) ||
    "es"
  );
}

/** `/legal#ancla` keeps `?lang=` when the current URL already has it. */
export function legalHref(hash: string, search = ""): string {
  const lang = langFromQuery(search);
  const id = hash.replace(/^#/, "");
  const base = lang ? `/legal?lang=${lang}` : "/legal";
  return id && id !== "legal" ? `${base}#${id}` : base;
}
export function retainLangSearch(raw: Record<string, unknown>): { lang?: AppLang } {
  const lang = langFromQuery(raw);
  return lang ? { lang } : {};
}

export function pickLang(...candidates: unknown[]): AppLang {
  for (const c of candidates) {
    const lang = langFromQuery(c);
    if (lang) return lang;
  }
  return "es";
}

export function langIsExplicit(...candidates: unknown[]): boolean {
  return candidates.some((c) => langFromQuery(c) != null);
}

/** D-418: sin `?lang=` el cliente queda en es (SSR). Ni localStorage ni navigator. */
export function resolveClientLang(search = ""): AppLang {
  return langFromQuery(search) || "es";
}

function readLang(): AppLang {
  if (typeof window === "undefined") return "es";
  try {
    return resolveClientLang(window.location.search);
  } catch {
    return "es";
  }
}

export const useLocale = create<{ lang: AppLang; setLang: (lang: AppLang) => void; hydrate: () => void }>(
  (set) => ({
    lang: "es",
    setLang: (lang) => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", lang);
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch {
        /* ignore */
      }
      if (typeof document !== "undefined") document.documentElement.lang = lang;
      set({ lang });
    },
    hydrate: () => {
      const lang = readLang();
      if (typeof document !== "undefined") document.documentElement.lang = lang;
      set({ lang });
    },
  }),
);
