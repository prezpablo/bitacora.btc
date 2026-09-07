import { LEGAL_EU, type LegalBlock } from "@/domain/legal-eu";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((p) => (
        <p key={p.slice(0, 48)} className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
          {p}
        </p>
      ))}
    </>
  );
}

function LegalTable({ table }: { table: NonNullable<LegalBlock["table"]> }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-foreground">
            {table.head.map((h) => (
              <th key={h} scope="col" className="py-2 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row[0]} className="border-b border-border align-top">
              {row.map((cell, i) => (
                <td
                  key={`${row[0]}-${i}`}
                  className={cn("py-2 pr-3 text-muted-foreground", i === 0 && "font-medium text-foreground")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalEu() {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const copy = LEGAL_EU[lang];
  return (
    <section id="legal" className="scroll-mt-[var(--header-offset)] space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">{t("legalKicker")}</p>
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{t("legalTitle")}</h1>
        <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">{copy.lead}</p>
      </header>
      <div className="space-y-3">
        {copy.blocks.map((b) => (
          <article
            key={b.title}
            id={b.id}
            className={cn("rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5", b.id && "scroll-mt-[var(--header-offset)]")}
          >
            <h2 className="font-display text-lg font-medium text-foreground">{b.title}</h2>
            <Paragraphs text={b.body} />
            {b.table ? <LegalTable table={b.table} /> : null}
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("legalDisclaimer")}</p>
    </section>
  );
}
