import { useRouterState } from "@tanstack/react-router";
import type { NavItem } from "@/domain/nav";
import { useT, type CopyKey } from "@/lib/i18n";
import { scrollDeskTo } from "@/lib/desk-scroll";
import { cn } from "@/lib/utils";

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
  const hash = useRouterState({
    select: (s) => String(s.location.hash || "").replace(/^#/, ""),
  });
  return (
    <header className="sticky top-0 z-20 space-y-1 bg-background pb-1 sm:space-y-2 sm:pb-2">
      <p className="text-[10px] font-medium tracking-wide text-primary uppercase sm:text-xs">{t(kicker)}</p>
      <nav aria-label={t(kicker)} className="flex flex-nowrap gap-1 sm:flex-wrap sm:gap-[0.618rem]">
        {items.map((item) => {
          const root = !hash || hash === fallbackHash || hash === parentHash;
          const on = hash === item.hash || (root && item.hash === fallbackHash);
          return (
            <a
              key={item.id}
              href={`#${item.hash}`}
              title={t(labels[item.id] || kicker)}
              onClick={() => {
                window.setTimeout(() => scrollDeskTo(item.hash), 50);
              }}
              className={cn(
                "inline-flex h-7 min-h-6 min-w-0 flex-1 items-center justify-center truncate rounded-md px-1.5 text-center text-[10px] leading-tight whitespace-nowrap no-underline shadow-[var(--shadow-border)] sm:h-9 sm:flex-none sm:px-3 sm:text-sm",
                on
                  ? "bg-card font-medium text-foreground"
                  : "bg-elevated text-muted-foreground hover:text-foreground",
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
