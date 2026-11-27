import {
  featuredActions,
  featuredHref,
  featuredLinkSplit,
  featuredSourceLabel,
  featuredText,
  foreignLang,
  formatFeaturedCompact,
  siteAsset,
  type AppLang,
  type EventLang,
  type FeaturedEvent,
  type FeaturedLinkKind,
} from "@/domain/featured-event";
import { useAppLang, useT, type CopyKey } from "@/lib/i18n";

const LINK_FULL: Record<FeaturedLinkKind, CopyKey> = {
  event: "featuredPage",
  tickets: "featuredTickets",
  agenda: "featuredAgenda",
};

const LINK_SHORT: Record<FeaturedLinkKind, CopyKey> = {
  event: "featuredPageShort",
  tickets: "featuredTicketsShort",
  agenda: "featuredAgendaShort",
};

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4f2f1]";

function Marked({ text, textLang, uiLang }: { text: string; textLang: EventLang; uiLang: AppLang }) {
  const mark = foreignLang(textLang, uiLang);
  return mark ? <span lang={mark}>{text}</span> : text;
}

function clockOf(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match || !/(?:Z|[+-]\d{2}:\d{2})$/.test(iso)) return "";
  return `${match[4]}:${match[5]}`;
}

function Credit({ event, lang, externalId }: { event: FeaturedEvent; lang: AppLang; externalId: string }) {
  const t = useT();
  const source = featuredHref(event.credit.source);
  if (!source) return null;
  const linkClass = `text-[#f4f2f1] underline underline-offset-2 ${FOCUS}`;
  if (event.credit.kind === "image") {
    const host = featuredSourceLabel(source);
    const [before = "", rest = ""] = t("featuredCreditImage").split("{artist}");
    const [mid = "", after = ""] = rest.split("{source}");
    return (
      <p className="text-[11px] leading-snug text-[#f4f2f1]">
        {before}
        <Marked text={event.credit.artist} textLang={event.lang} uiLang={lang} />
        {mid}
        <a href={source} target="_blank" rel="noopener noreferrer" aria-describedby={externalId} className={linkClass}>
          {host}
        </a>
        {after}
      </p>
    );
  }
  const name = event.credit.kind === "bitacora" ? event.credit.identity : event.credit.artist;
  const template = event.credit.kind === "bitacora" ? t("featuredCreditDesign") : t("featuredCreditArt");
  const token = event.credit.kind === "bitacora" ? "identity" : "artist";
  const [before, after] = template.split(`{${token}}`);
  return (
    <p className="text-[11px] leading-snug text-[#f4f2f1]">
      {before}
      <Marked text={name} textLang={event.lang} uiLang={lang} />
      {after ?? ""}{" "}
      <a href={source} target="_blank" rel="noopener noreferrer" aria-describedby={externalId} className={linkClass}>
        {t("featuredSourceLink")}
      </a>
    </p>
  );
}

/** Banner de `variant: "special"`. Sin movimiento. El texto es real, no va horneado en la foto. */
export function SpecialEventBanner({ event }: { event: FeaturedEvent }) {
  const t = useT();
  const lang = useAppLang();
  const title = featuredText(event.title, lang);
  const titleLang = foreignLang(event.lang, lang);
  const place = featuredText(event.place, lang);
  const when = event.startsAt ? formatFeaturedCompact(event.startsAt, lang) : "";
  const endClock = clockOf(event.endsAt);
  const note = featuredText(event.note, lang);
  const where = featuredText(event.where, lang);
  const hosts = featuredText(event.hosts, lang);
  const program = featuredText(event.program, lang);
  const links = featuredActions(event);
  const src = siteAsset(event.image.src);
  const avif = siteAsset(event.image.avif);
  const webp = siteAsset(event.image.webp);
  const titleId = `special-${event.id}-title`;
  const kickerId = `special-${event.id}-kicker`;
  const externalId = `special-${event.id}-external`;

  return (
    <section
      aria-labelledby={`${kickerId} ${titleId}`}
      className="overflow-hidden rounded-[12px] border border-[#302c2e] bg-[#1a1a1d] text-[#f4f2f1] shadow-[0_12px_28px_rgba(26,26,29,0.16)]"
    >
      <div className="h-1 bg-[#da8347]" aria-hidden="true" />
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-4 sm:p-4">
        {src ? (
          <picture className="shrink-0">
            {avif ? <source srcSet={avif} type="image/avif" /> : null}
            {webp ? <source srcSet={webp} type="image/webp" /> : null}
            <img
              src={src}
              alt={featuredText(event.alt, lang)}
              width={event.image.width}
              height={event.image.height}
              className="block h-28 w-28 rounded-md object-cover sm:h-[200px] sm:w-[200px]"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </picture>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p id={kickerId} className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] text-[#dd8f5b] uppercase">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-[#ec7103]" />
            {t("featuredSpecialKicker")}
          </p>
          <p id={titleId} lang={titleLang} className="font-display text-lg font-bold leading-tight text-[#f4f2f1] sm:text-xl">
            {title}
          </p>
          {when ? (
            <p className="text-sm leading-snug text-[#f4f2f1]">
              {event.startsAt ? <time dateTime={event.startsAt}>{when}</time> : when}
              {endClock ? (
                <>
                  <span aria-hidden="true">–</span>
                  <span className="sr-only">{lang === "en" ? " to " : lang === "pt" ? " às " : " a "}</span>
                  <time dateTime={event.endsAt}>{endClock}</time>
                </>
              ) : null}
              {place ? ` · ${place}` : null}
            </p>
          ) : null}
          {note ? <p className="text-xs leading-snug text-pretty text-[#f4f2f1]">{note}</p> : null}
          {where ? <p className="text-xs leading-snug text-pretty text-[#f4f2f1]">{where}</p> : null}
          {hosts ? <p className="text-xs leading-snug text-pretty text-[#f4f2f1]">{hosts}</p> : null}
          {program ? <p className="text-xs leading-snug text-pretty text-[#f4f2f1]">{program}</p> : null}
          {links.length ? (
            <div className="flex flex-row flex-wrap gap-2 pt-1">
              {links.map((link) => {
                const custom = event.cta?.[link.kind];
                const visible = custom ? featuredText(custom.short, lang) : t(LINK_SHORT[link.kind]);
                const full = custom ? featuredText(custom.full, lang) : t(LINK_FULL[link.kind]);
                const parts = featuredLinkSplit(full, visible);
                const filled = link.kind === "tickets";
                return (
                  <a
                    key={link.kind}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-describedby={externalId}
                    className={
                      filled
                        ? `inline-flex min-h-11 items-center rounded-full bg-[linear-gradient(180deg,#2d61e6,#1f4ed5)] px-3.5 text-sm font-medium text-white no-underline ${FOCUS}`
                        : `inline-flex min-h-11 items-center rounded-full border border-[#f4f2f1] px-3.5 text-sm font-medium text-[#f4f2f1] no-underline ${FOCUS}`
                    }
                  >
                    {visible}
                    {parts ? (
                      <span className="sr-only">
                        {parts.lead}
                        <Marked text={title} textLang={event.lang} uiLang={lang} />
                        {parts.tail}
                      </span>
                    ) : null}
                  </a>
                );
              })}
            </div>
          ) : null}
          <Credit event={event} lang={lang} externalId={externalId} />
          <p id={externalId} className="sr-only">
            {t("featuredExternal")}
          </p>
        </div>
      </div>
    </section>
  );
}
