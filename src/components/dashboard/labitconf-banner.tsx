import { pickFeatured, utcDay } from "@/domain/featured-event";
import { useT } from "@/lib/i18n";

/** El evento vigente, con su propia pieza y sus colores. Sin sello de destacado ni de patrocinado. */
export function LabitconfBanner() {
  const t = useT();
  const event = pickFeatured(utcDay());
  if (!event) return null;
  const tickets = event.tickets || event.site;
  const pill = "absolute inline-flex min-h-8 items-center rounded-full px-3 py-1 text-[11px] font-black tracking-[0.08em] uppercase no-underline sm:px-4 sm:text-xs";
  return (
    <div className="group relative overflow-hidden rounded-lg border-2" style={{ borderColor: event.accent, background: event.ink }}>
      <a href={event.site} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={event.image}
          alt={t(event.altKey)}
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
