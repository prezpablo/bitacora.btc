import { SeoFaq } from "@/components/seo-head";
import { CONCIENCIA, useAppLang, useT } from "@/lib/i18n";

export function ConcienciaBlock() {
  const t = useT();
  const lang = useAppLang();
  const c = CONCIENCIA[lang];
  return (
    <div className="space-y-6">
    <article className="space-y-6 rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{c.welcome}</h1>
        <p className="max-w-2xl text-base text-pretty text-muted-foreground">{c.lead}</p>
      </header>

      <div className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">{c.whatTitle}</h2>
        <p className="text-sm text-pretty leading-relaxed text-muted-foreground sm:text-base">{c.what1}</p>
        <p className="text-sm text-pretty leading-relaxed text-muted-foreground sm:text-base">{c.what2}</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">{c.drivenTitle}</h2>
        <p className="text-sm text-pretty leading-relaxed text-muted-foreground sm:text-base">{c.driven1}</p>
        <p className="text-sm text-pretty leading-relaxed text-muted-foreground sm:text-base">{c.driven2}</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">{c.mapTitle}</h2>
        <ul className="space-y-3">
          {c.mapItems.map((item) => (
            <li key={item.title} className="text-sm leading-relaxed sm:text-base">
              <span className="font-medium text-foreground">
                {item.mark} {item.title}:
              </span>{" "}
              <span className="text-pretty text-muted-foreground">{item.body}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">{c.joinTitle}</h2>
        <p className="text-sm text-pretty leading-relaxed text-muted-foreground sm:text-base">{c.join}</p>
        <a
          href="#mapa"
          className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-white no-underline hover:opacity-90"
        >
          {t("navMapa")}
        </a>
      </div>
    </article>
    <SeoFaq lang={lang} />
    </div>
  );
}
