import type { AppLang } from "./locale";

export function localeTag(lang: AppLang) {
  if (lang === "pt") return "pt-BR";
  if (lang === "en") return "en";
  return "es";
}

const names = new Map<AppLang, Intl.DisplayNames>();

export function countryName(code: string, lang: AppLang, fallback = "") {
  const iso = code.trim().toUpperCase();
  if (!iso || iso.length !== 2) return fallback || iso;
  try {
    let dn = names.get(lang);
    if (!dn) {
      dn = new Intl.DisplayNames([localeTag(lang)], { type: "region" });
      names.set(lang, dn);
    }
    return dn.of(iso) || fallback || iso;
  } catch {
    return fallback || iso;
  }
}
