export const EVENT_PAGE = 9;

export function sortEventsByDate<T extends { startAt: number }>(rows: T[], dir: "asc" | "desc") {
  const copy = rows.slice();
  copy.sort((a, b) => (dir === "asc" ? a.startAt - b.startAt : b.startAt - a.startAt));
  return copy;
}

export function pageEvents<T>(rows: T[], page: number, size = EVENT_PAGE) {
  const pages = Math.max(1, Math.ceil(rows.length / size) || 1);
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * size;
  return { page: p, pages, slice: rows.slice(start, start + size) };
}
