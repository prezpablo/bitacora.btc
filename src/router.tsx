import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent, AppNotFound } from "@/lib/error-component";
import { cspNonce } from "@/lib/csp-nonce";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const nonce = cspNonce();
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: AppNotFound,
    ...(nonce ? { ssr: { nonce } } : {}),
  });
}