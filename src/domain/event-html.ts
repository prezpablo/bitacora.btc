/** Seis próximos, sin foto ni texto largo, para el HTML de la primera respuesta. */
export const EVENT_HTML_CAP = 6;

export type EventHtmlRow = {
  title: string;
  city: string;
  startAt: number;
  url: string;
};

export function eventHtmlDay(ms: number) {
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

export function upcomingEventHtml(
  rows: { title?: string; city?: string; startAt?: number; url?: string }[],
  now = Date.now(),
  cap = EVENT_HTML_CAP,
): EventHtmlRow[] {
  const out: EventHtmlRow[] = [];
  const sorted = rows
    .filter((e) => Number.isFinite(e.startAt) && (e.startAt as number) >= now)
    .sort((a, b) => (a.startAt as number) - (b.startAt as number));
  for (const e of sorted) {
    const title = String(e.title || "").trim().slice(0, 140);
    const url = String(e.url || "");
    if (!title || !url.startsWith("https://")) continue;
    out.push({
      title,
      city: String(e.city || "").trim().slice(0, 80),
      startAt: e.startAt as number,
      url,
    });
    if (out.length >= cap) break;
  }
  return out;
}
