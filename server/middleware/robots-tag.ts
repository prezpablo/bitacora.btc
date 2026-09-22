/** /labif: header noindex besides meta (GSC drops faster than meta alone). */
interface RobotsEvent {
  url: URL;
}

export default async function robotsTagMiddleware(
  event: RobotsEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const result = await next();
  const path = event.url.pathname.replace(/\/$/, "") || "/";
  if (path !== "/labif" || !(result instanceof Response)) return result;
  const headers = new Headers(result.headers);
  headers.set("X-Robots-Tag", "noindex, follow");
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
}
