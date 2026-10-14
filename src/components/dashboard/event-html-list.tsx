import { eventHtmlDay, type EventHtmlRow } from "@/domain/event-html";
import { useT } from "@/lib/i18n";

export function EventHtmlList({ rows }: { rows: EventHtmlRow[] }) {
  const t = useT();
  if (!rows.length) return null;
  return (
    <section aria-labelledby="eventos-html-title">
      <h3 id="eventos-html-title" className="font-display text-lg font-medium tracking-tight text-foreground">
        {t("eventHtmlTitle")}
      </h3>
      <ol className="mt-2 space-y-1 text-sm text-foreground">
        {rows.map((e) => (
          <li key={`${e.startAt}-${e.url}`}>
            <a href={e.url} className="underline-offset-2 hover:underline" rel="noopener noreferrer">
              {e.title}
            </a>
            {" · "}
            <span>{e.city || t("netOnlineCont")}</span>
            {" · "}
            <time dateTime={eventHtmlDay(e.startAt)}>{eventHtmlDay(e.startAt)}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}
