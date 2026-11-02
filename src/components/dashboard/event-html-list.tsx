import { eventHtmlDay, type EventHtmlRow } from "@/domain/event-html";

/** Los seis próximos quedan en el primer HTML para quien no ejecuta JavaScript.
 *  No se pintan: el tablero de eventos, debajo, ya los muestra. */
export function EventHtmlList({ rows }: { rows: EventHtmlRow[] }) {
  if (!rows.length) return null;
  return (
    <ol hidden>
      {rows.map((e) => (
        <li key={`${e.startAt}-${e.url}`}>
          <a href={e.url} rel="noopener noreferrer">
            {e.title}
          </a>
          {e.city ? <span> · {e.city}</span> : null}
          {" · "}
          <time dateTime={eventHtmlDay(e.startAt)}>{eventHtmlDay(e.startAt)}</time>
        </li>
      ))}
    </ol>
  );
}
