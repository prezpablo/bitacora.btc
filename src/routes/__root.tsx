import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppQueryProvider } from "@/lib/query";
import { jsonLd, OG_IMAGE_PATH, PUBLIC_ORIGIN, SEO } from "@/lib/seo";
import appCss from "../styles.css?url";

const APP_NAME = "Bitácora.btc";
const TITLE = SEO.es.title;
const DESC = SEO.es.description;
const ORIGIN = PUBLIC_ORIGIN;
const CANONICAL = `${ORIGIN}/`;
const LD = JSON.stringify(jsonLd("es", ORIGIN));

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
      { name: "google-site-verification", content: "w4NkiP98t6wqRqMRrpXgVAY4Q3n82dCclvOV4AVw9uc" },
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
      { property: "og:image", content: `${ORIGIN}${OG_IMAGE_PATH}` },
      { property: "og:image:alt", content: TITLE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:locale", content: "es_UY" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:locale:alternate", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: `${ORIGIN}${OG_IMAGE_PATH}` },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "canonical", href: CANONICAL },
      { rel: "author", href: "/humans.txt" },
      { rel: "alternate", href: `${CANONICAL}?lang=es`, hrefLang: "es" },
      { rel: "alternate", href: `${CANONICAL}?lang=pt`, hrefLang: "pt" },
      { rel: "alternate", href: `${CANONICAL}?lang=en`, hrefLang: "en" },
      { rel: "alternate", href: CANONICAL, hrefLang: "x-default" },
    ],
  }),
  component: () => (
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LD }} />
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
