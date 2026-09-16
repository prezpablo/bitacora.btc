import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { StorageBanner } from "@/components/storage-banner";
import { BrandMark } from "@/components/dashboard/brand-mark";
import { SeoHead } from "@/components/seo-head";
import { SkipLink } from "@/components/skip-link";
import { COPY, useAppLang, useT, type CopyKey } from "@/lib/i18n";
import { LANGS, useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { LEGAL_NAV, PRIMARY_NAV, TELEGRAM_COMMUNITY, UTILITY_NAV, spyOf, type NavItem } from "@/domain/nav";
import { requestJoinMap } from "@/application/join-map";
import { scrollDeskTo } from "@/lib/desk-scroll";

const ContributeQr = lazy(() => import("@/components/contribute-qr").then((m) => ({ default: m.ContributeQr })));

const NAV_COPY: Record<string, CopyKey> = {
  mapa: "navMapa",
  comunidad: "navComunidad",
  aprender: "navAprender",
  mercado: "navMercado",
  hacia: "navHacia",
  contacto: "navContacto",
  privacidad: "navShortLegal",
};

function navHref(item: NavItem, pathname: string) {
  if (item.href) return item.href;
  return pathname === "/" ? `#${item.hash}` : `/#${item.hash}`;
}

function LangButtons() {
  const t = useT();
  const lang = useAppLang();
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
  const lang = useAppLang();
  const labels = COPY[lang];
  const headRef = useRef<HTMLElement>(null);
  const offsetRef = useRef(116);
  const lockRef = useRef<string | null>(null);
  const lockTimer = useRef(0);
  const legalPage = pathname === "/legal";
  const items = legalPage ? LEGAL_NAV : PRIMARY_NAV;
  const [spy, setSpy] = useState(() => {
    const h = String(hash || "").replace(/^#/, "");
    if (h) return h;
    return pathname === "/legal" ? "privacidad" : "mapa";
  });

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
    const ids = items.map((n) => n.hash);

    const go = (id: string) => {
      lockRef.current = id;
      setSpy(legalPage ? id : spyOf(id));
      const qs = window.location.search || "";
      const path = pathname || "/";
      history.replaceState(null, "", `${path}${qs}#${id}`);
      window.dispatchEvent(new Event("bitacora-desk"));
      window.setTimeout(() => {
        scrollDeskTo(id);
      }, 40);
      window.clearTimeout(lockTimer.current);
      lockTimer.current = window.setTimeout(() => {
        lockRef.current = null;
      }, 1600);
      return true;
    };

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      let id = "";
      if (href.startsWith("#")) id = href.slice(1);
      else {
        try {
          const u = new URL(href, window.location.origin);
          if (u.pathname === (pathname || "/") && u.hash) id = u.hash.slice(1);
        } catch {
          return;
        }
      }
      if (!id || id === "contenido") return;
      e.preventDefault();
      go(id);
    };

    const onScroll = () => {
      if (lockRef.current) return;
      const line = offsetRef.current + 8;
      let current = "";
      for (const id of ids) {
        const node = document.getElementById(id);
        if (!node || node.offsetParent === null) continue;
        if (node.getBoundingClientRect().top <= line + 2) current = id;
      }
      if (current) setSpy(current);
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    onScroll();
    return () => {
      window.clearTimeout(lockTimer.current);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname, legalPage]);

  const activeHash = spy || items[0]!.hash;

  function goJoin() {
    requestJoinMap();
    if (pathname !== "/") {
      window.location.assign("/#mapa");
      return;
    }
    history.replaceState(null, "", `${pathname || "/"}${window.location.search || ""}#mapa`);
    window.dispatchEvent(new Event("bitacora-desk"));
    setSpy("mapa");
    window.setTimeout(() => {
      scrollDeskTo("mapa");
    }, 40);
  }

  return (
    <header ref={headRef} className="site-head sticky top-0 z-[80] isolate border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-[0.618rem] px-4 py-[0.618rem] sm:px-[1.618rem]">
        <Link to="/" className="min-w-0 no-underline">
          <BrandMark compact />
        </Link>
        <div className="flex items-center gap-[0.618rem]">
          <button
            type="button"
            onClick={goJoin}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-white sm:h-9 sm:text-sm"
          >
            {labels.navSumate}
          </button>
          <LangButtons />
        </div>
      </div>
      <nav
        className="border-t border-border"
        aria-label={labels.navAria}
        lang={lang}
        data-destinos={legalPage ? undefined : items.map((n) => n.id).join(",")}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-4 px-1 sm:px-[1.618rem]">
          {items.map((item) => {
            const active = activeHash === item.hash;
            const href = legalPage ? `#${item.hash}` : navHref(item, pathname);
            const key = NAV_COPY[item.id] || "navMapa";
            return (
              <a
                key={`${lang}-${item.id}`}
                href={href}
                className={cn(
                  "inline-flex items-center justify-center border-b-2 px-[0.5rem] py-[0.618rem] text-center text-[0.7rem] leading-tight no-underline sm:px-[0.618rem] sm:text-sm",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {labels[key]}
              </a>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

export function SiteShell({ children, fill = false }: { children: ReactNode; fill?: boolean }) {
  const t = useT();
  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", fill && "h-dvh overflow-hidden")}>
      <SkipLink />
      <SeoHead />
      <SiteHeader />
      <main
        id="contenido"
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 sm:gap-[1.618rem] sm:px-[1.618rem]",
          fill ? "min-h-0 overflow-hidden py-2" : "py-4 sm:py-[1.618rem] lg:py-[2.618rem]",
        )}
      >
        {children}
      </main>
      <footer className={cn("border-t border-border", fill ? "shrink-0" : "mt-auto")}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-3 py-1.5 sm:px-[1.618rem] sm:py-2">
          <p className="flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-center text-[11px] leading-tight text-muted-foreground sm:text-xs">
            <span className="font-display tracking-wide text-foreground">{t("initiative")}</span>
            <img
              src="/latam-cripto-mom.jpg"
              alt="Latam Cripto Mom"
              width={20}
              height={20}
              loading="lazy"
              decoding="async"
              className="size-5 rounded-full object-cover sm:size-6"
            />
            <span>
              <a href="https://bitacorabtc.org" className="font-medium text-foreground underline underline-offset-2">
                Bitácora.btc
              </a>
              {" · "}
              {t("taglineShort")}
            </span>
          </p>
          <nav
            aria-label={t("legalNavAria")}
            className="flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-0 text-[11px] leading-none sm:text-xs"
          >
            {UTILITY_NAV.map((item) => (
              <a key={item.id} href={navHref(item, "/")} className="inline-flex min-h-6 min-w-6 items-center text-foreground">
                {t(NAV_COPY[item.id] || "navContacto")}
              </a>
            ))}
            <a
              href={TELEGRAM_COMMUNITY}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-6 min-w-6 items-center text-foreground"
            >
              {t("joinTelegram")}
            </a>
            <span id="aportes" className="inline-flex min-h-6 min-w-6 scroll-mt-[var(--header-offset)] items-center">
              <Suspense fallback={null}>
                <ContributeQr compact />
              </Suspense>
            </span>
            <a href="/#datos" className="inline-flex min-h-6 min-w-6 items-center text-foreground">
              {t("dataOrigin")}
            </a>
            <a href="/#soberania" className="inline-flex min-h-6 min-w-6 items-center text-foreground">
              {t("sovTitle")}
            </a>
            <a href="/legal#aviso" className="inline-flex min-h-6 min-w-6 items-center text-foreground">
              {t("legalAviso")}
            </a>
            <a href="/legal#privacidad" className="inline-flex min-h-6 min-w-6 items-center text-foreground">
              {t("legalPrivacy")}
            </a>
            <a href="/legal#cookies" className="inline-flex min-h-6 min-w-6 items-center text-foreground">
              {t("legalCookies")}
            </a>
            <a href="/legal#accesibilidad" className="inline-flex min-h-6 min-w-6 items-center text-foreground">
              {t("legalA11y")}
            </a>
            <a href="/legal#terminos" className="inline-flex min-h-6 min-w-6 items-center text-foreground">
              {t("legalTerms")}
            </a>
          </nav>
        </div>
      </footer>
      <StorageBanner />
    </div>
  );
}
