import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppQueryProvider } from "@/lib/query";
import { PUBLIC_ORIGIN } from "@/lib/seo";
import appCss from "../styles.css?url";

const APP_NAME = "Bitácora.btc";
const TITLE = "Bitácora.btc | Mapa de comunidades y comercios Bitcoin en Latinoamérica";
const DESC =
  "Mapa interactivo de comunidades, nodos y comercios que aceptan Bitcoin en Latinoamérica. Eventos, pulso on-chain y educación. Una iniciativa de Consciencia Bitcoin desde Colonia del Sacramento, Uruguay.";
const ORIGIN = PUBLIC_ORIGIN;
const CANONICAL = `${ORIGIN}/`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: TITLE },
      { name: "description", content: DESC },
      {
        name: "keywords",
        content:
          "Bitcoin, mapa Bitcoin, comunidades Bitcoin, Latinoamérica, comercios Bitcoin, Lightning, autocustodia, Consciencia Bitcoin, Colonia del Sacramento, Uruguay",
      },
      { name: "author", content: "Consciencia Bitcoin" },
      { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1" },
      { name: "theme-color", content: "#f7931a" },
      { name: "geo.region", content: "UY-CO" },
      { name: "geo.placename", content: "Colonia del Sacramento, Uruguay" },
      { name: "geo.position", content: "-34.4717;-57.8443" },
      { name: "ICBM", content: "-34.4717, -57.8443" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: `${ORIGIN}/og.jpg` },
      { property: "og:locale", content: "es_UY" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: `${ORIGIN}/og.jpg` },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "canonical", href: CANONICAL },
      { rel: "alternate", href: `${CANONICAL}?lang=es`, hrefLang: "es" },
      { rel: "alternate", href: `${CANONICAL}?lang=pt`, hrefLang: "pt" },
      { rel: "alternate", href: `${CANONICAL}?lang=en`, hrefLang: "en" },
      { rel: "alternate", href: CANONICAL, hrefLang: "x-default" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&family=Ubuntu+Mono:wght@400;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <AppQueryProvider>
            <Outlet />
          </AppQueryProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
