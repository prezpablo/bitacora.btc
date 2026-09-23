/** /labif and HTTP 404: header noindex (meta alone arrives late for GSC). */
interface RobotsEvent {
  url: URL;
}

export default async function robotsTagMiddleware(
  event: RobotsEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const result = await next();
  if (!(result instanceof Response)) return result;
  const path = event.url.pathname.replace(/\/$/, "") || "/";
  if (path !== "/labif" && result.status !== 404) return result;
  const headers = new Headers(result.headers);
  headers.set("X-Robots-Tag", "noindex, follow");
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
}
