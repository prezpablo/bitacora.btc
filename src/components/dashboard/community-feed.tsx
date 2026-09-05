import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Radio, RefreshCw, Zap } from "lucide-react";
import { getCommunityFeed } from "@/infrastructure/server-fns";
import { formatAgo, useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CommunityFeedPanel({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const q = useQuery({
    queryKey: ["community-feed", lang],
    queryFn: () => getCommunityFeed({ data: { lang } }),
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
  const posts = q.data?.posts ?? [];
  const rows = compact ? posts.slice(0, 6) : posts;

  return (
    <section className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <Radio className="size-4 text-primary" aria-hidden="true" />
          {t("communityTitle")}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {q.isFetching ? t("communityCatch") : t("communityLive")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("refreshFeed")}
            onClick={() => q.refetch()}
          >
            <RefreshCw className={cn("size-4", q.isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">
        {t("communityLead")}
      </p>
      <ul className={cn("mt-3 space-y-3", compact ? "max-h-80 overflow-auto" : "max-h-[28rem] overflow-auto")}>
        {rows.length === 0 ? (
          <li className="text-sm text-muted-foreground">{q.isError ? t("communityFail") : t("communityEmpty")}</li>
        ) : (
          rows.map((p) => (
            <li key={p.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block no-underline">
                <p className="text-sm font-medium text-pretty text-foreground group-hover:text-primary">{p.title}</p>
                {!compact && p.body ? (
                  <p className="mt-1 text-sm text-pretty text-muted-foreground">{p.body}</p>
                ) : null}
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="text-primary">{p.source}</span>
                  <span>@{p.author}</span>
                  <span>{formatAgo(p.at, t)}</span>
                  {p.sats > 0 ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Zap className="size-3 text-primary" aria-hidden="true" />
                      {p.sats}
                    </span>
                  ) : null}
                  {p.comments > 0 ? <span>{p.comments} resp.</span> : null}
                  <ExternalLink className="size-3 opacity-60" aria-hidden="true" />
                </p>
              </a>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
