/** Better Auth apagado (`VITE_AUTH_ENABLED=false`): no entra al bundle. */

export function betterAuth() {
  return {
    handler: async () => new Response("auth off", { status: 404 }),
    api: { getSession: async () => null },
  };
}

export function bearer() {
  return {};
}

export function genericOAuth() {
  return {};
}

export function tanstackStartCookies() {
  return {};
}

export function createAuthClient() {
  return {
    useSession: () => ({ data: null, isPending: false }),
    signIn: { social: async () => ({}), email: async () => ({}) },
    signOut: async () => ({}),
  };
}

export function genericOAuthClient() {
  return {};
}

export default { betterAuth, createAuthClient };
