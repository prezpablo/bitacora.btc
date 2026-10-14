import { LEGAL_EU, legalBody, type LegalBlock } from "@/domain/legal-eu";
import { LEGAL, LEGAL_CITY, VPS_COUNTRY, legalFilled } from "@/domain/legal-config";
import { THIRD_PARTIES, type ThirdParty } from "@/domain/third-parties";
import { useAppLang, useT } from "@/lib/i18n";
import type { AppLang } from "@/lib/locale";
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

function PartyList({ title, side, lang }: { title: string; side: ThirdParty["side"]; lang: AppLang }) {
  const rows = THIRD_PARTIES.filter((p) => p.side === side);
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <ul className="mt-2 space-y-2">
        {rows.map((p) => {
          const country = p.name === "Njalla" && legalFilled(LEGAL.vpsCountry) ? VPS_COUNTRY[lang] : p.country[lang];
          const shown = legalFilled(country) ? country : "";
          return (
            <li key={`${side}-${p.name}`} className="text-sm leading-relaxed text-pretty text-muted-foreground">
              <span className="font-medium text-foreground">{p.name}</span>
              {shown ? ` · ${shown}` : ""}
              {p.hosts.length ? ` · ${p.hosts.join(", ")}` : ""}. {p.why[lang]}
            </li>
          );
        })}
      </ul>
    </div>
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
  const lang = useAppLang();
  const copy = LEGAL_EU[lang];
  return (
    <section id="legal" className="scroll-mt-[var(--header-offset)] space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">{t("legalKicker")}</p>
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{t("legalTitle")}</h1>
        <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">{copy.lead}</p>
        <p className="text-xs text-muted-foreground">{t("legalVersion", { v: LEGAL.consentVersion })}</p>
      </header>
      <nav aria-label={t("legalIndex")} className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {copy.blocks
          .filter((b) => b.id)
          .map((b) => (
            <a key={b.id} href={`#${b.id}`} className="text-foreground underline-offset-2 hover:underline">
              {b.title}
            </a>
          ))}
      </nav>
      <div className="space-y-3">
        {copy.blocks.map((b) => (
          <article
            key={b.title}
            id={b.id}
            className={cn("rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5", b.id && "scroll-mt-[var(--header-offset)]")}
          >
            <h2 className="font-display text-lg font-medium text-foreground">{b.title}</h2>
            <Paragraphs text={legalBody(b.body, lang)} />
            {b.clauses?.map((c) => (
              <div key={c.title} className="mt-3">
                <h3 className="text-sm font-medium text-foreground">{c.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{c.body}</p>
              </div>
            ))}
            {b.id === "aviso" || b.id === "derechos" ? (
              <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                {t("legalRightsChannel", { email: LEGAL.privacyEmail })}{" "}
                {legalFilled(LEGAL.controllerName)
                  ? `${t(legalFilled(LEGAL.address) ? "legalWho" : "legalWhoPending", {
                      name: LEGAL.controllerName,
                      address: LEGAL.address,
                      city: LEGAL_CITY[lang],
                      email: LEGAL.privacyEmail,
                    })} `
                  : null}
                <a className="font-medium text-foreground underline underline-offset-2" href={`mailto:${LEGAL.privacyEmail}`}>
                  {t("footerRights")}
                </a>
              </p>
            ) : null}
            {b.id === "terceros" ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {t("thirdLead")}{" "}
                  {legalFilled(LEGAL.vpsCountry) ? t("thirdVps", { vps: VPS_COUNTRY[lang] }) : null}{" "}
                  {legalFilled(LEGAL.translator) ? t("thirdTranslator", { translator: LEGAL.translator }) : null}
                </p>
                <PartyList title={t("thirdBrowser")} side="browser" lang={lang} />
                <PartyList title={t("thirdRecipients")} side="recipient" lang={lang} />
                <PartyList title={t("thirdServer")} side="server" lang={lang} />
              </>
            ) : null}
            {b.table ? <LegalTable table={b.table} /> : null}
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("legalDisclaimer")}</p>
    </section>
  );
}
