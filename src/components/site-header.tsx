import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ContributeQr } from "@/components/contribute-qr";
import { StorageBanner } from "@/components/storage-banner";
import { BrandMark } from "@/components/dashboard/brand-mark";
import { SeoHead } from "@/components/seo-head";
import { COPY, useT, type CopyKey } from "@/lib/i18n";
import { LANGS, useLocale, type AppLang } from "@/lib/locale";
import { cn } from "@/lib/utils";

const NAV: { hash: string; key: CopyKey }[] = [
  { hash: "mapa", key: "navMapa" },
  { hash: "conciencia", key: "navParticipe" },
  { hash: "roadmap", key: "navRoadmap" },
  { hash: "comunidad", key: "navComunidad" },
  { hash: "pulso", key: "navPulso" },
  { hash: "historia", key: "navHistoria" },
  { hash: "red", key: "navRed" },
  { hash: "mercado", key: "navMercado" },
  { hash: "legal", key: "legalTitle" },
  { hash: "contacto", key: "navContacto" },
];

function LangButtons() {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const setLang = useLocale((s) => s.setLang);
  return (
    <div role="group" aria-label={t("langAria")} className="inline-flex rounded-md bg-elevated p-0.5 shadow-[var(--shadow-border)]">
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => setLang(l.value)}
          className={cn(
            "h-8 min-w-9 rounded px-2 font-mono text-xs font-medium sm:h-9 sm:min-w-11 sm:px-2.5 sm:text-sm",
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
  const lang = useLocale((s) => s.lang);
  const labels = COPY[lang];
  const headRef = useRef<HTMLElement>(null);
  const offsetRef = useRef(116);
  const lockRef = useRef<string | null>(null);
  const lockTimer = useRef(0);
  const [spy, setSpy] = useState(() => (hash || "mapa").replace(/^#/, "") || "mapa");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const apply = () => {
      const h = el.getBoundingClientRect().height;
      offsetRef.current = h;
      document.documentElement.style.setProperty("--header-offset", `${Math.round(h + 8)}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [lang]);

  useEffect(() => {
    const ids = NAV.map((n) => n.hash);

    const go = (id: string) => {
      const node = document.getElementById(id);
      if (!node) return false;
      lockRef.current = id;
      if (ids.includes(id)) setSpy(id);
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      const qs = window.location.search || "";
      const path = pathname || "/";
      history.replaceState(null, "", `${path}${qs}#${id}`);
      window.clearTimeout(lockTimer.current);
      lockTimer.current = window.setTimeout(() => {
        lockRef.current = null;
      }, 1600);
      return true;
    };

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const id = href.startsWith("#") ? href.slice(1) : "";
      if (!id || id === "contenido") return;
      if (!document.getElementById(id)) return;
      e.preventDefault();
      go(id);
    };

    const onScroll = () => {
      if (lockRef.current) return;
      const line = offsetRef.current + 8;
      let current = ids[0]!;
      for (const id of ids) {
        const node = document.getElementById(id);
        if (node && node.getBoundingClientRect().top <= line + 2) current = id;
      }
      setSpy(current);
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.clearTimeout(lockTimer.current);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  const activeHash = spy || "mapa";

  return (
    <header ref={headRef} className="sticky top-0 z-[80] isolate border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-[0.618rem] px-4 py-[0.618rem] sm:px-[1.618rem]">
        <Link to="/" className="min-w-0 no-underline">
          <BrandMark compact />
        </Link>
        <div className="flex items-center gap-[0.618rem]">
          <ContributeQr compact />
          <LangButtons />
        </div>
      </div>
      <nav className="border-t border-border" aria-label={labels.navAria} lang={lang}>
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center px-1 sm:px-[1.618rem]">
          {NAV.map((item) => {
            const active = activeHash === item.hash;
            return (
              <a
                key={`${lang}-${item.hash}`}
                href={`#${item.hash}`}
                className={cn(
                  "inline-flex max-w-[48%] items-center justify-center border-b-2 px-[0.5rem] py-[0.618rem] text-center text-[0.7rem] leading-tight no-underline sm:max-w-none sm:px-[0.618rem] sm:text-sm",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {labels[item.key]}
              </a>
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
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[90] focus:m-3 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        {t("skipToContent")}
      </a>
      <SeoHead />
      <SiteHeader />
      <main id="contenido" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-[1.618rem] px-4 py-[1.618rem] sm:px-[1.618rem] sm:py-[2.618rem]">
        {children}
      </main>
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-[1rem] px-4 py-[1.618rem] sm:px-[1.618rem] sm:py-[2.618rem]">
          <div className="flex flex-wrap items-center justify-center gap-[1rem]">
            <p className="font-display text-center text-base tracking-wide text-foreground sm:text-lg">
              {t("initiative")}
            </p>
            <img
              src="/latam-cripto-mom.png"
              alt="Latam Cripto Mom"
              width={88}
              height={88}
              className="size-[4.236rem] sm:size-[5.236rem]"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-[1rem] gap-y-[0.382rem] text-sm text-muted-foreground">
            <p>
              <a href="https://bitacorabtc.org" className="text-foreground">
                Bitácora.btc
              </a>
              {" · "}
              {t("taglineShort")}
            </p>
            <a href="#datos" className="text-foreground">
              {t("dataOrigin")}
            </a>
            <a href="#soberania" className="text-foreground">
              {t("sovTitle")}
            </a>
            <a href="#legal" className="text-foreground">
              {t("legalTitle")}
            </a>
          </div>
          <img
            src="/logos/veintiuno-libre.svg"
            alt="Veintiuno Libre. Código abierto. Dinero abierto. Comunidad abierta."
            width={280}
            height={280}
            className="mt-[0.382rem] h-auto w-[11.09rem] sm:w-[13.944rem]"
          />
        </div>
      </footer>
      <StorageBanner />
    </div>
  );
}
