import { ROADMAP_WEB3 } from "@/domain/roadmap-web3";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale";

export function RoadmapWeb3() {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const copy = ROADMAP_WEB3[lang];
  return (
    <section id="roadmap" className="scroll-mt-[var(--header-offset)] space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">{t("rmKicker")}</p>
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{t("rmTitle")}</h2>
        <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">{copy.lead}</p>
      </header>
      <aside className="rounded-lg border border-primary/40 bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">{t("rmBarTitle")}</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
          {copy.bar.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </aside>
      <p className="rounded-lg bg-card p-4 text-sm leading-relaxed text-pretty text-muted-foreground shadow-[var(--shadow-border)] sm:p-5">
        <span className="font-medium text-foreground">{t("rmDoneTitle")}. </span>
        {copy.done}
      </p>
      <ol className="grid gap-3">
        {copy.phases.map((p) => (
          <li key={p.id} className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-medium text-foreground">{p.title}</h3>
              <span className="text-xs font-medium tracking-wide text-primary uppercase">{p.when}</span>
            </div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              {p.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {p.checks.length ? (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-medium tracking-wide text-primary uppercase">{t("rmChecks")}</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
                  {p.checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="text-sm text-pretty text-muted-foreground">{copy.note}</p>
    </section>
  );
}
