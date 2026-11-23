import {
  featuredHref,
  featuredLinks,
  featuredText,
  foreignLang,
  formatFeaturedWhen,
  pickFeatured,
  siteAsset,
  type AppLang,
  type EventLang,
  type FeaturedLinkKind,
} from "@/domain/featured-event";
import { useAppLang, useT, type CopyKey } from "@/lib/i18n";

const LINK_LABEL: Record<FeaturedLinkKind, CopyKey> = {
  event: "featuredPage",
  tickets: "featuredTickets",
  agenda: "featuredAgenda",
};

const ON_INK = "#f4f4f1";

function Slot({
  template,
  token,
  value,
  valueLang,
  uiLang,
}: {
  template: string;
  token: string;
  value: string;
  valueLang: EventLang;
  uiLang: AppLang;
}) {
  const [before, after] = template.split(`{${token}}`);
  const mark = foreignLang(valueLang, uiLang);
  return (
    <>
      {before}
      {mark ? <span lang={mark}>{value}</span> : value}
      {after ?? ""}
    </>
  );
}

/** El evento que todavía no cerró. Si no hay ninguno, no ocupa lugar. */
export function FeaturedEventBanner({ now }: { now?: Date }) {
  const t = useT();
  const lang = useAppLang();
  const event = pickFeatured(now ?? new Date());
  if (!event) return null;

  const title = featuredText(event.title, lang);
  const titleLang = foreignLang(event.lang, lang);
  const where = featuredText(event.where, lang);
  const note = featuredText(event.note, lang);
  const when = event.startsAt ? formatFeaturedWhen(event.startsAt, lang) : "";
  const links = featuredLinks(event);
  const src = siteAsset(event.image.src);
  const avif = siteAsset(event.image.avif);
  const webp = siteAsset(event.image.webp);
  const source = featuredHref(event.credit.source);
  const titleId = `featured-${event.id}-title`;
  const kickerId = `featured-${event.id}-kicker`;
  const externalId = `featured-${event.id}-external`;

  return (
    <section
      aria-labelledby={`${kickerId} ${titleId}`}
      className="overflow-hidden rounded-lg border-2"
      style={{ borderColor: event.accent, background: event.ink }}
    >
      <figure>
        {src ? (
          <picture>
            {avif ? <source srcSet={avif} type="image/avif" /> : null}
            {webp ? <source srcSet={webp} type="image/webp" /> : null}
            <img
              src={src}
              alt={featuredText(event.alt, lang)}
              width={event.image.width}
              height={event.image.height}
              className="h-auto w-full"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </picture>
        ) : null}
        <figcaption className="space-y-1 px-3 pt-3 text-sm text-pretty" style={{ color: ON_INK }}>
          <p id={kickerId} className="text-xs font-medium tracking-wide uppercase">
            {t("featuredKicker")}
          </p>
          <p id={titleId} lang={titleLang} className="font-display text-base font-medium" style={{ color: "#ffffff" }}>
            {title}
          </p>
          {when && event.startsAt ? (
            <p>
              <time dateTime={event.startsAt}>{when}</time>
            </p>
          ) : null}
          {where ? <p>{where}</p> : null}
          {note ? <p>{note}</p> : null}
          <p>
            {event.credit.kind === "bitacora" ? (
              <Slot
                template={t("featuredCreditDesign")}
                token="identity"
                value={event.credit.identity}
                valueLang={event.lang}
                uiLang={lang}
              />
            ) : (
              <Slot
                template={t("featuredCreditArt")}
                token="artist"
                value={event.credit.artist}
                valueLang={event.lang}
                uiLang={lang}
              />
            )}
            {source ? <> {t("featuredSource", { source })}</> : null}
          </p>
        </figcaption>
      </figure>
      {links.length ? (
        <div className="flex flex-wrap gap-2 px-3 py-3">
          {links.map((link) => (
            <a
              key={link.kind}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby={externalId}
              className="inline-flex min-h-11 max-w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-pretty no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ background: event.accent, color: event.ink }}
            >
              <Slot template={t(LINK_LABEL[link.kind])} token="title" value={title} valueLang={event.lang} uiLang={lang} />
            </a>
          ))}
          <p id={externalId} className="basis-full text-xs text-pretty" style={{ color: ON_INK }}>
            {t("featuredExternal")}
          </p>
        </div>
      ) : null}
    </section>
  );
}
