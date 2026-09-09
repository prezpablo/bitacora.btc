import { getRequest } from "@tanstack/react-start/server";
import { langFromQuery, type AppLang } from "./locale";

/** Server-only. Do not import from client modules except inside a route loader. */
export function langFromServerRequest(): AppLang | null {
  try {
    const req = getRequest();
    return req?.url ? langFromQuery(req.url) : null;
  } catch {
    return null;
  }
}
