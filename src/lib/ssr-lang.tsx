import { createContext, useContext, type ReactNode } from "react";
import type { AppLang } from "./locale";

const SsrLangContext = createContext<AppLang | null>(null);

/** Root loader lang for the first HTML byte. Do not seed the zustand store on the server. */
export function SsrLangProvider({ lang, children }: { lang: AppLang; children: ReactNode }) {
  return <SsrLangContext.Provider value={lang}>{children}</SsrLangContext.Provider>;
}

export function useSsrLang(): AppLang | null {
  return useContext(SsrLangContext);
}
