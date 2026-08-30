import { SOBERANIA } from "@/domain/soberania";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale";

export function SoberaniaBlock() {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const copy = SOBERANIA[lang];
  return (
    <section id="soberania" className="scroll-mt-[var(--header-offset)] space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">{t("sovKicker")}</p>
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{t("sovTitle")}</h2>
        <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">{copy.lead}</p>
      </header>
      <aside className="rounded-lg border border-primary/40 bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        <h3 className="font-display text-lg font-medium text-primary">{t("sovGmailTitle")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-foreground">{copy.gmail}</p>
      </aside>
      <div className="space-y-3">
        {copy.blocks.map((b) => (
          <article key={b.title} className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
            <h3 className="font-display text-lg font-medium text-foreground">{b.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{b.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
