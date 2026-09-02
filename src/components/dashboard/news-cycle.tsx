import { useEffect, useState } from "react";
import { ExternalLink, Radio } from "lucide-react";
import type { NewsItem, PulsePayload } from "@/domain";
import { translateNews } from "@/infrastructure/translate";
import { formatAgo, useT } from "@/lib/i18n";
import { usePrefersReducedMotion } from "@/lib/motion";
import { StaleStamp } from "./stale-stamp";
import { LANGS, useLocale, type AppLang } from "@/lib/locale";
import { cn } from "@/lib/utils";

function headline(item: { title: string; sourceLang?: string }) {
  const lang = item.sourceLang?.toUpperCase();
  return lang ? `${item.title} (${lang})` : item.title;
}

export type PulseLang = AppLang;

export function NewsCycle({ data }: { data: PulsePayload | null }) {
  const lang = useLocale((s) => s.lang) as AppLang;
  const setLang = useLocale((s) => s.setLang);
  const t = useT();
  const source = data?.news ?? [];
  const trends = data?.trends ?? [];
  const [news, setNews] = useState<NewsItem[]>(source);
  const [trStatus, setTrStatus] = useState<"ok" | "partial" | "off" | "loading">("loading");
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const n = news.length;
  const asOf = data?.asOf;

  useEffect(() => {
    const src = data?.news ?? [];
    setNews(src);
    setI(0);
    if (!src.length) {
      setTrStatus("off");
      return;
    }
    const ctrl = new AbortController();
    let alive = true;
    setTrStatus("loading");
    void translateNews(src, lang, ctrl.signal)
      .then(({ rows, status }) => {
        if (!alive) return;
        setNews(rows);
        setTrStatus(status);
      })
      .catch(() => {
        if (!alive) return;
        setNews(src);
        setTrStatus("off");
      });
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [lang, asOf]);

  useEffect(() => {
    if (n < 2 || paused || reduceMotion) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % n), 8_000);
    return () => window.clearInterval(id);
  }, [n, data?.asOf, paused, reduceMotion]);

  const featured = n ? news[i % n] : null;
  const rest = n ? news.filter((_, idx) => idx !== i % n).slice(0, 5) : [];

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
            <Radio className="size-4 text-long" aria-hidden="true" />
            {t("pulseTitle")}
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">
            {t("pulseLead")}
          </p>
          <StaleStamp asOf={asOf} />
          <div role="group" aria-label={t("langAria")} className="mt-2 inline-flex rounded-md bg-elevated p-0.5 shadow-[var(--shadow-border)]">
            {LANGS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLang(l.value)}
                className={cn(
                  "h-8 min-w-10 rounded px-2 font-mono text-xs font-medium",
                  lang === l.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={lang === l.value}
              >
                {l.short}
              </button>
            ))}
          </div>
        </div>
        {n ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-elevated px-2 py-1 text-xs font-medium text-foreground"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
            >
              {paused ? t("pulsePlay") : t("pulsePause")}
            </button>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {((i % n) + 1).toString().padStart(2, "0")}/{n.toString().padStart(2, "0")}
            </p>
          </div>
        ) : null}
      </div>

      {trStatus === "loading" ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {t("pulseTranslating")}
        </p>
      ) : trStatus !== "ok" ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {trStatus === "off" ? t("pulseOff") : t("pulsePartial")}
        </p>
      ) : null}

      {featured ? (
        <a
          key={featured.id}
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="velar-news-in mt-4 block rounded-xl bg-elevated px-4 py-3 shadow-[var(--shadow-border)] hover:bg-subtle"
        >
          <p className="text-xs font-medium tracking-wide text-long uppercase">
            {t("featured")} · {featured.tag}
          </p>
          <p className="mt-1 text-base font-medium text-pretty text-foreground">{headline(featured)}</p>
          {featured.summary ? (
            <p className="mt-2 text-sm text-pretty text-muted-foreground">{featured.summary}</p>
          ) : null}
          <p className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            {featured.source}
            {featured.published ? ` · ${formatAgo(featured.published, t)}` : ""}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </p>
        </a>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {data == null ? t("loading") : t("noHits")}
        </p>
      )}

      {rest.length ? (
        <ul className="mt-3 divide-y divide-border">
          {rest.map((row) => (
            <li key={row.id}>
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-3 py-2.5 hover:text-foreground"
              >
                <div className="min-w-0">
                  <p className="text-sm text-pretty text-foreground">{headline(row)}</p>
                  {row.summary ? (
                    <p className="mt-1 line-clamp-2 text-sm text-pretty text-muted-foreground">{row.summary}</p>
                  ) : null}
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {row.tag} · {row.source}
                    {row.published ? ` · ${formatAgo(row.published, t)}` : ""}
                  </p>
                </div>
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {n > 1 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {news.map((row, idx) => (
            <button
              key={row.id}
              type="button"
              aria-label={t("newsDot", { n: idx + 1 })}
              className={cn(
                "h-1.5 min-w-4 flex-1 rounded-full",
                idx === i % n ? "bg-long" : "bg-border",
              )}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      ) : null}

      {trends.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="text-xs tracking-wide text-muted-foreground uppercase">{t("trends")}</span>
          {trends.map((t) => {
            const up = (t.change24h ?? 0) >= 0;
            return (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-1 font-mono text-xs tabular-nums shadow-[var(--shadow-border)]"
              >
                <span className="text-foreground">{t.symbol}</span>
                {t.change24h != null ? (
                  <span className={up ? "text-long" : "text-short"}>
                    {up ? "+" : ""}
                    {t.change24h.toFixed(1)}%
                  </span>
                ) : t.rank != null ? (
                  <span className="text-muted-foreground">#{t.rank}</span>
                ) : null}
              </span>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
