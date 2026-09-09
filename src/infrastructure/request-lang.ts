import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { langFromQuery, type AppLang } from "@/lib/locale";

/** `?lang=` from the HTTP request. Server-fn so the client bundle never sees `*.server.ts`. */
export const getRequestLang = createServerFn({ method: "GET" }).handler(async (): Promise<AppLang | null> => {
  try {
    const req = getRequest();
    return req?.url ? langFromQuery(req.url) : null;
  } catch {
    return null;
  }
});
