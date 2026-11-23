import { featuredAlt, pickFeatured, utcDay, type FeaturedEvent } from "@/domain/featured-event";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/** El evento vigente. El cartel nuevo lleva los botones debajo. El Zonte va partido. */
export function LabitconfBanner() {
  const event = pickFeatured(utcDay());
  if (!event) return null;
  if (event.split) return <BeachSplit />;
  if (event.poster) return <PosterBanner event={event} />;
  return <OverlayBanner event={event} />;
}

function PosterBanner({ event }: { event: FeaturedEvent }) {
  const t = useT();
  const alt = featuredAlt(event) ?? (event.altKey ? t(event.altKey) : (event.name ?? ""));
  const actions = [
    { href: event.site, label: t("eventPage") },
    event.tickets ? { href: event.tickets, label: t("eventTickets") } : null,
    event.agenda ? { href: event.agenda, label: t("eventAgenda") } : null,
  ].filter((row): row is { href: string; label: string } => Boolean(row));
  return (
    <figure className="overflow-hidden rounded-lg bg-card shadow-[var(--shadow-border)]">
      <a href={event.site} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={event.image}
          alt={alt}
          width={1200}
          height={630}
          className="aspect-[1200/630] h-auto w-full object-cover object-center"
          decoding="async"
        />
      </a>
      <figcaption className="flex flex-col gap-2 p-3 sm:flex-row sm:flex-wrap sm:p-4">
        {actions.map((action) => (
          <Button key={action.label} asChild className="w-full sm:w-auto">
            <a href={action.href} target="_blank" rel="noopener noreferrer">
              {action.label}
            </a>
          </Button>
        ))}
      </figcaption>
    </figure>
  );
}

function OverlayBanner({ event }: { event: FeaturedEvent }) {
  const t = useT();
  const tickets = event.tickets || event.site;
  const alt = featuredAlt(event) ?? (event.altKey ? t(event.altKey) : (event.name ?? ""));
  const pill =
    "absolute inline-flex min-h-8 items-center rounded-full px-3 py-1 text-[11px] font-black tracking-[0.08em] uppercase no-underline sm:px-4 sm:text-xs";
  return (
    <div
      className="group relative overflow-hidden rounded-lg border-2"
      style={{ borderColor: event.accent, background: event.ink }}
    >
      <a href={event.site} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={event.image}
          alt={alt}
          width={1600}
          height={592}
          className="aspect-[8/3] w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
          decoding="async"
        />
      </a>
      {event.agenda ? (
        <a
          href={event.agenda}
          target="_blank"
          rel="noopener noreferrer"
          className={`${pill} bottom-2 left-2 sm:bottom-3 sm:left-3`}
          style={{ background: event.accent, color: event.ink }}
        >
          {t("labitAgenda")}
        </a>
      ) : null}
      <a
        href={tickets}
        target="_blank"
        rel="noopener noreferrer"
        className={`${pill} right-2 bottom-2 sm:right-3 sm:bottom-3`}
        style={{ background: event.accent, color: event.ink }}
      >
        {t("labitCta")}
      </a>
    </div>
  );
}

function BeachSplit() {
  const t = useT();
  const site = "https://www.bitcoinbeach.com/";
  const floats = [
    { top: "6%", left: "10%", delay: "0s", size: "13px", dur: "6.4s" },
    { top: "22%", left: "58%", delay: "1.1s", size: "18px", dur: "7.8s" },
    { top: "40%", left: "18%", delay: "2.4s", size: "11px", dur: "8.6s" },
    { top: "58%", left: "64%", delay: "0.6s", size: "15px", dur: "7.1s" },
    { top: "74%", left: "28%", delay: "3.2s", size: "12px", dur: "9s" },
    { top: "88%", left: "70%", delay: "1.8s", size: "16px", dur: "6.8s" },
  ];
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-lg border-2 border-[#FE6A00] bg-[#101820]">
      <a
        href={site}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center bg-[#1a0c08]"
        aria-label={t("beachAlt")}
      >
        <img
          src="/eventos/beach-summit.jpg"
          alt={t("beachCircular")}
          width={931}
          height={518}
          className="h-auto w-full"
          decoding="async"
        />
      </a>
      <a
        href={site}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex w-24 items-center justify-center overflow-hidden border-x border-border bg-white sm:w-28"
      >
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {floats.map((f) => (
            <span
              key={f.delay + f.left}
              className="beach-btc"
              style={{
                top: f.top,
                left: f.left,
                fontSize: f.size,
                animationDelay: f.delay,
                animationDuration: f.dur,
              }}
            >
              ₿
            </span>
          ))}
        </span>
        <span className="beach-more relative z-10 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-white sm:h-9 sm:px-3.5 sm:text-sm">
          {t("beachTickets")}
        </span>
      </a>
      <a
        href={site}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center bg-[#f6ead2]"
      >
        <img
          src="/eventos/beach-festival.jpg"
          alt={t("beachFestival")}
          width={931}
          height={430}
          className="h-auto w-full"
          decoding="async"
        />
      </a>
    </div>
  );
}
