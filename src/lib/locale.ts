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
  } else if (raw && typeof raw === "object" && "lang" in raw) {
    const v = (raw as { lang?: unknown }).lang;
    q = typeof v === "string" ? v : null;
  }
  const l = (q || "").slice(0, 2).toLowerCase();
  return l === "es" || l === "en" || l === "pt" ? l : null;
}

export function langFromLocation(location: { search?: unknown; searchStr?: string; href?: string }): AppLang {
  return langFromQuery(location.search) || langFromQuery(location.searchStr) || langFromQuery(location.href) || "es";
}

function readLang(): AppLang {
  if (typeof window === "undefined") return "es";
  try {
    const q = langFromQuery(window.location.search);
    if (q) return q;
  } catch {
    /* ignore */
  }
  const stored = window.localStorage.getItem("bitacora-lang");
  if (stored === "es" || stored === "en" || stored === "pt") return stored;
  const nav = window.navigator.language.slice(0, 2);
  if (nav === "pt") return "pt";
  if (nav === "en") return "en";
  return "es";
}

export const useLocale = create<{ lang: AppLang; setLang: (lang: AppLang) => void; hydrate: () => void }>(
  (set) => ({
    lang: "es",
    setLang: (lang) => {
      try {
        window.localStorage.setItem("bitacora-lang", lang);
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
