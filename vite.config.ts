import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
// @ts-expect-error JS plugin alongside the TS vite config
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

/** The files `src/lib/db.ts` globs — same directory, same non-recursive scope. */
function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

/**
 * Finish PGLite bootstrap during dev-server setup (before traffic). Vite awaits
 * async `configureServer` hooks. Production: `src/lib/db` kicks `ensureDbReady`
 * on import.
 *
 * Vite awaiting the hook puts this on time-to-first-render, so an app with no
 * migrations — no schema to apply — skips it entirely rather than paying for a
 * PGLite instance it never queries.
 */
function sourceRev() {
  const env = process.env.SOURCE_REV || "";
  if (/^[0-9a-f]{7,40}$/i.test(env)) return env.slice(0, 7).toLowerCase();
  try {
    const sha = execSync("git rev-parse --short=7 HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    return /^[0-9a-f]{7}$/.test(sha) ? sha : "";
  } catch {
    return "";
  }
}

function revPlugin(rev: string): Plugin {
  return {
    name: "bitacora-rev",
    transform(_code, id) {
      const path = id.split("?")[0].replace(/\\/g, "/");
      if (!path.endsWith("/src/build-rev.ts")) return;
      return `export const BUILD_REV = ${JSON.stringify(rev)};\n`;
    },
  };
}

function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

/**
 * Live-preview OAuth popup — handled HERE so the agent never has to create a
 * `/auth/popup` route (and cannot break it by scaffolding a React page that
 * paints the full app shell in the popup).
 *
 * `signIn` (client.ts) opens `/auth/popup?providerId=…` in a top-level window.
 * This middleware runs before TanStack Start, calls `handleAuthPopupRequest`,
 * and returns the 302 / completion HTML. Deployed apps do not use the popup
 * (full-page OAuth redirect), so `apply: "serve"` is enough.
 */
function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      // Register immediately (not in a returned post-hook) so we run BEFORE
      // TanStack Start / the SPA HTML fallback. A model-authored
      // `src/routes/auth/popup.tsx` React page must never win this path.
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          );
          const proto = String(
            req.headers["x-forwarded-proto"] ??
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http"),
          );
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          // Ensure Host is the public preview host so Better Auth's dynamic
          // baseURL / redirect_uri match the popup origin.
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          // Preserve multiple Set-Cookie headers (OAuth state + session).
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

function globeStubOnServer(): Plugin {
  const stub = join(process.cwd(), "src/infrastructure/globe-stub.ts");
  const hit = (id: string) =>
    id === "react-globe.gl" ||
    id === "globe.gl" ||
    id === "three-globe" ||
    id === "three-render-objects" ||
    id.startsWith("react-globe.gl/") ||
    id.startsWith("globe.gl/") ||
    id.startsWith("three-globe/");
  return {
    name: "bitacora-globe-ssr-stub",
    enforce: "pre",
    apply: "build",
    resolveId(id) {
      const env = this.environment?.name;
      if (env !== "ssr" && env !== "nitro") return;
      if (hit(id)) return stub;
    },
  };
}

function authOffStubOnBuild(): Plugin {
  const authStub = join(process.cwd(), "src/infrastructure/auth-lib-stub.ts");
  const pgliteStub = join(process.cwd(), "src/infrastructure/pglite-stub.ts");
  const off = process.env.VITE_AUTH_ENABLED === "false";
  return {
    name: "bitacora-auth-off-stub",
    enforce: "pre",
    apply: "build",
    resolveId(id) {
      if (!off) return;
      if (id === "better-auth" || id.startsWith("better-auth/")) return authStub;
      if (id === "@electric-sql/pglite" || id.startsWith("@electric-sql/pglite/")) return pgliteStub;
    },
  };
}

function firebaseAliases() {
  const on = Boolean(process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID);
  if (on) return {};
  const stub = join(process.cwd(), "src/infrastructure/firebase-stub.ts");
  return {
    "firebase/app": stub,
    "firebase/auth": stub,
    "firebase/firestore": stub,
  };
}

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, isPreview }) => {
  const rev = sourceRev();
  if (command === "build" && process.env.VITE_PUBLIC_HOSTNAME === "bitacorabtc.org" && !/^[0-9a-f]{7}$/.test(rev)) {
    throw new Error("D-FOSS: el build de bitacorabtc.org no tiene commit. SOURCE_REV vacío y no hay git.");
  }
  return {
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true, alias: firebaseAliases() },
  optimizeDeps: {
    include: ["three", "react-globe.gl", "three-globe"],
  },
  ssr: {
    external: ["react-globe.gl", "three", "three-globe", "maplibre-gl", "@maplibre/maplibre-gl-leaflet", "node:sqlite"],
  },
  plugins: [
    revPlugin(rev),
    globeStubOnServer(),
    authOffStubOnBuild(),
    pgliteBootstrapPlugin(),
    // Before tanstackStart so /auth/popup never falls through to the SPA.
    authPopupPlugin(),
    // Dev-only /__app-env, read by scripts/check-auth-invariant.mjs.
    appEnvPlugin(),
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            // Vercel = preview de Grok. En el VPS: NITRO_PRESET=node-server
            preset: process.env.NITRO_PRESET || "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
          }),
        ]
      : []),
    viteReact(),
  ],
};
});
