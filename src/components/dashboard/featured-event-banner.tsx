import {
  featuredHref,
  featuredLinks,
  featuredLinkSplit,
  featuredText,
  foreignLang,
  formatFeaturedCompact,
  pickFeatured,
  pickSpecialFeatured,
  siteAsset,
  type AppLang,
  type EventLang,
  type FeaturedEvent,
  type FeaturedLinkKind,
} from "@/domain/featured-event";
import { BeachSplit, SovereignBanner } from "./labitconf-banner";
import { SpecialEventBanner } from "./special-event-banner";
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

function Marked({ text, textLang, uiLang }: { text: string; textLang: EventLang; uiLang: AppLang }) {
  const mark = foreignLang(textLang, uiLang);
  return mark ? <span lang={mark}>{text}</span> : text;
}

/** El especial vigente, arriba, y el destacado común que todavía no cerró. */
export function FeaturedEventBanner({ now }: { now?: Date }) {
  const clock = now ?? new Date();
  const specials = pickSpecialFeatured(clock);
  const event = pickFeatured(clock);
  if (!specials.length && !event) return null;
  return (
    <div className="space-y-3">
      {specials.map((item) => (
        <SpecialEventBanner key={item.id} event={item} />
      ))}
      {event ? <FeaturedEventCard event={event} /> : null}
    </div>
  );
}

function FeaturedEventCard({ event }: { event: FeaturedEvent }) {
  const t = useT();
  const lang = useAppLang();

  if (event.id === "bitcoin-beach-2026") return <BeachSplit />;
  if (event.id === "sovereign-2026") return <SovereignBanner />;

  const title = featuredText(event.title, lang);
  const titleLang = foreignLang(event.lang, lang);
  const place = featuredText(event.place, lang);
  const when = event.startsAt ? formatFeaturedCompact(event.startsAt, lang) : "";
  const links = featuredLinks(event);
  const src = siteAsset(event.image.src);
  const avif = siteAsset(event.image.avif);
  const webp = siteAsset(event.image.webp);
  const source = featuredHref(event.credit.source);
  const titleId = `featured-${event.id}-title`;
  const kickerId = `featured-${event.id}-kicker`;
  const externalId = `featured-${event.id}-external`;
  const creditName = event.credit.kind === "bitacora" ? event.credit.identity : event.credit.artist;
  const creditTemplate = event.credit.kind === "bitacora" ? t("featuredCreditDesign") : t("featuredCreditArt");
  const creditToken = event.credit.kind === "bitacora" ? "identity" : "artist";
  const [creditBefore, creditAfter] = creditTemplate.split(`{${creditToken}}`);

  return (
    <section aria-labelledby={`${kickerId} ${titleId}`}>
      <figure className="flex flex-col overflow-hidden rounded-[12px] border border-[#e6d5c3] bg-[#fbf6ef] shadow-[0_10px_28px_rgba(90,55,20,0.10)] sm:flex-row sm:items-center">
        {src ? (
          <picture className="flex justify-center bg-white sm:max-w-[68%] sm:shrink-0">
            {avif ? <source srcSet={avif} type="image/avif" /> : null}
            {webp ? <source srcSet={webp} type="image/webp" /> : null}
            <img
              src={src}
              alt={featuredText(event.alt, lang)}
              width={event.image.width}
              height={event.image.height}
              className="block h-auto max-h-32 w-full object-contain object-left sm:max-h-[200px] sm:w-auto sm:max-w-[46rem]"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </picture>
        ) : null}
        <figcaption className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-3 py-3 sm:px-4">
          <p id={kickerId} className="text-xs font-medium tracking-wide text-primary uppercase">
            {t("featuredKicker")}
          </p>
          <p id={titleId} lang={titleLang} className="sr-only">
            {title}
          </p>
          {when && event.startsAt ? (
            <p className="text-sm text-foreground">
              <time dateTime={event.startsAt}>{when}</time>
              {place ? ` · ${place}` : null}
            </p>
          ) : null}
          <p className="text-xs text-pretty text-muted-foreground">
            {creditBefore}
            <Marked text={creditName} textLang={event.lang} uiLang={lang} />
            {creditAfter ?? ""}
            {source ? (
              <>
                {" "}
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-describedby={externalId}
                  className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {t("featuredSourceLink")}
                  <span className="sr-only">
                    {" "}
                    <Marked text={title} textLang={event.lang} uiLang={lang} />
                  </span>
                </a>
              </>
            ) : null}
          </p>
          {links.length ? (
            <div className="flex flex-row flex-wrap gap-2">
              {links.map((link) => {
                const visible = t(LINK_SHORT[link.kind]);
                const parts = featuredLinkSplit(t(LINK_FULL[link.kind]), visible);
                return (
                  <a
                    key={link.kind}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-describedby={externalId}
                    className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 text-sm font-medium text-white no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
              <p id={externalId} className="sr-only">
                {t("featuredExternal")}
              </p>
            </div>
          ) : null}
        </figcaption>
      </figure>
    </section>
  );
}
