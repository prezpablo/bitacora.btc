import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { hubChipOn, type NavItem } from "@/domain/nav";
import { useT, type CopyKey } from "@/lib/i18n";
import { scrollDeskTo } from "@/lib/desk-scroll";
import { cn } from "@/lib/utils";

/** El clic de la barra escribe el hash con replaceState. El router no siempre se entera. */
function useDeskHash() {
  const routeHash = useRouterState({
    select: (s) => String(s.location.hash || "").replace(/^#/, ""),
  });
  const [hash, setHash] = useState(routeHash);
  useEffect(() => {
    const read = () => setHash(window.location.hash.replace(/^#/, ""));
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("bitacora-desk", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("bitacora-desk", read);
    };
  }, []);
  useEffect(() => {
    setHash(routeHash);
  }, [routeHash]);
  return hash;
}

export function HubIndex({
  kicker,
  items,
  labels,
  fallbackHash,
  parentHash,
}: {
  kicker: CopyKey;
  items: readonly NavItem[];
  labels: Record<string, CopyKey>;
  fallbackHash: string;
  parentHash?: string;
}) {
  const t = useT();
  const hash = useDeskHash();
  return (
    <header className="relative z-20 space-y-1 bg-background pb-1 sm:sticky sm:top-0 sm:space-y-2 sm:pb-2">
      <p className="text-[10px] font-medium tracking-wide text-primary uppercase sm:text-xs">{t(kicker)}</p>
      <nav aria-label={t(kicker)} className="chip-row">
        {items.map((item) => {
          const on = hubChipOn(hash, item.hash, fallbackHash, parentHash);
          return (
            <a
              key={item.id}
              href={`#${item.hash}`}
              title={t(labels[item.id] || kicker)}
              aria-current={on ? "location" : undefined}
              onClick={() => {
                window.setTimeout(() => scrollDeskTo(item.hash), 50);
              }}
              className={cn(
                "chip no-underline",
                on ? "chip-on" : "chip-idle hover:text-foreground",
              )}
            >
              {t(labels[item.id] || kicker)}
            </a>
          );
        })}
      </nav>
    </header>
  );
}