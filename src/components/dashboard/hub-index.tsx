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
    <header className="sticky top-0 z-20 space-y-2 bg-background pb-2">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">{t(kicker)}</p>
      <nav aria-label={t(kicker)} className="flex flex-wrap gap-[0.618rem]">
        {items.map((item) => {
          const root = !hash || hash === fallbackHash || hash === parentHash;
          const on = hash === item.hash || (root && item.hash === fallbackHash);
          return (
            <a
              key={item.id}
              href={`#${item.hash}`}
              onClick={() => {
                window.setTimeout(() => scrollDeskTo(item.hash), 50);
              }}
              className={cn(
                "inline-flex h-9 items-center rounded-md px-3 text-sm no-underline shadow-[var(--shadow-border)]",
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
