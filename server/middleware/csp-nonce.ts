import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { CSP_POLICY, cspWithScriptNonce } from "../../src/domain/csp";
import { bindCspNonce } from "../../src/lib/csp-nonce";

const als = new AsyncLocalStorage<string>();
bindCspNonce(() => als.getStore() || "");

interface CspEvent {
  url: URL;
}

function nonce() {
  return randomBytes(16).toString("base64url");
}

/** En producción el HTML lleva nonce. En el preview se deja 'unsafe-inline' para Vite. */
export default async function cspNonceMiddleware(
  _event: CspEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const value = nonce();
  return als.run(value, async () => {
    const result = await next();
    if (!(result instanceof Response)) return result;
    const type = result.headers.get("content-type") || "";
    if (!type.includes("text/html")) return result;
    const policy = process.env.NODE_ENV === "development" ? CSP_POLICY : cspWithScriptNonce(CSP_POLICY, value);
    const headers = new Headers(result.headers);
    headers.set("Content-Security-Policy", policy);
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers,
    });
  });
}
