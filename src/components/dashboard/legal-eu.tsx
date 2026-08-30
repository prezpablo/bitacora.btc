import { LEGAL_EU } from "@/domain/legal-eu";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale";

export function LegalEu() {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const copy = LEGAL_EU[lang];
  return (
    <section id="legal" className="scroll-mt-[var(--header-offset)] space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">{t("legalKicker")}</p>
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{t("legalTitle")}</h2>
        <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">{copy.lead}</p>
      </header>
      <div className="space-y-3">
        {copy.blocks.map((b) => (
          <article key={b.title} className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
            <h3 className="font-display text-lg font-medium text-foreground">{b.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{b.body}</p>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("legalDisclaimer")}</p>
    </section>
  );
}
