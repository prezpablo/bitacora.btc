import { create } from "zustand";

export const LANGS = [
  { value: "es" as const, label: "Español", short: "ES" },
  { value: "pt" as const, label: "Português", short: "PT" },
  { value: "en" as const, label: "English", short: "EN" },
];

export type AppLang = (typeof LANGS)[number]["value"];

function readLang(): AppLang {
  if (typeof window === "undefined") return "es";
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q === "es" || q === "en" || q === "pt") return q;
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
