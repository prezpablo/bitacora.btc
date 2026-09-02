import { FileText } from "lucide-react";
import { MILESTONES, WHITEPAPER, useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale";

export function HistoryTimeline() {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const rows = MILESTONES[lang];
  const localPaper = WHITEPAPER[lang];

  return (
    <section id="historia" className="scroll-mt-[var(--header-offset)] space-y-5">
      <div>
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          {t("historyTitle")}
        </h2>
        <p className="mt-1 max-w-2xl text-base text-pretty text-muted-foreground">{t("historyLead")}</p>
      </div>
      <ol className="relative space-y-0 border-l border-border pl-6">
        {rows.map((m) => (
          <li key={m.date + m.title} className="relative pb-6 last:pb-0">
            <span className="absolute top-1.5 -left-[1.54rem] size-3 rounded-full bg-primary" aria-hidden="true" />
            <p className="font-mono text-xs tracking-wide text-primary">{m.date}</p>
            <h3 className="mt-0.5 text-base font-medium text-foreground">{m.title}</h3>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">{m.body}</p>
            <p className="mt-2 text-sm text-pretty text-foreground">
              <span className="font-medium text-primary">{t("historyMeaning")}.</span> {m.meaning}
            </p>
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-white no-underline hover:opacity-90"
            >
              {m.cta}
            </a>
          </li>
        ))}
      </ol>
      <div className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="font-medium text-foreground">{t("paperCta")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("paperHint")}</p>
            <a
              href={WHITEPAPER.original}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground no-underline hover:opacity-90"
            >
              {t("paperRead")}
            </a>
          </div>
        </div>
        {lang !== "en" ? (
          <p className="mt-3 text-sm">
            <a href={localPaper} target="_blank" rel="noopener noreferrer">
              {t("paperAlso")} ({lang.toUpperCase()})
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
