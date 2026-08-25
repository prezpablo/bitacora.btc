import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ContributeQr } from "@/components/contribute-qr";
import { BrandMark } from "@/components/dashboard/brand-mark";
import { useT } from "@/lib/i18n";
import { LANGS, useLocale, type AppLang } from "@/lib/locale";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", hash: "mercado", key: "navMercado" as const },
  { to: "/mapa", hash: undefined, key: "navMapa" as const },
  { to: "/", hash: "comunidad", key: "navComunidad" as const },
  { to: "/", hash: "pulso", key: "navPulso" as const },
  { to: "/", hash: "red", key: "navRed" as const },
  { to: "/", hash: "historia", key: "navHistoria" as const },
  { to: "/", hash: "participe", key: "navParticipe" as const },
];

function LangButtons() {
  const lang = useLocale((s) => s.lang);
  const setLang = useLocale((s) => s.setLang);
  return (
    <div role="group" aria-label="Idioma" className="inline-flex rounded-md bg-elevated p-0.5 shadow-[var(--shadow-border)]">
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => setLang(l.value as AppLang)}
          className={cn(
            "h-9 min-w-11 rounded px-2.5 font-mono text-sm font-medium",
            lang === l.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={lang === l.value}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const hydrate = useLocale((s) => s.hydrate);
  const t = useT();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="min-w-0 no-underline">
          <BrandMark compact />
        </Link>
        <div className="flex items-center gap-2">
          <ContributeQr compact />
          <LangButtons />
        </div>
      </div>
      <nav className="border-t border-border" aria-label={t("navAria")}>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4">
          {NAV.map((item) => {
            const active =
              item.to === "/mapa"
                ? pathname === "/mapa"
                : pathname === "/" && (item.hash ? hash === item.hash || (!hash && item.hash === "mercado") : true);
            return (
              <Link
                key={item.key}
                to={item.to}
                hash={item.hash}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-3 text-sm no-underline sm:px-4",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </div>
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <p className="font-display text-center text-base tracking-wide text-foreground sm:text-lg">
              {t("initiative")}
            </p>
            <img
              src="/latam-cripto-mom.png"
              alt="Latam Cripto Mom"
              width={88}
              height={88}
              className="size-16 sm:size-20"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <p>bitacora.btc · {t("taglineShort")}</p>
            <a href="/#datos" className="text-foreground">
              {t("dataOrigin")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
