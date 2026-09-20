import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { FAQ, GEO, OG_IMAGE_PATH, SITE_NAME, hreflangHref, jsonLd, pageCanonical, pagePath, pageSeo, robotsFor, siteOrigin } from "@/lib/seo";
import { langFromQuery, type AppLang } from "@/lib/locale";
import { useAppLang } from "@/lib/i18n";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  if (typeof document === "undefined") return;
  const sel = extra?.hreflang
    ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(sel) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (extra) for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
}

export function SeoHead() {
  const lang = useAppLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const search = useRouterState({ select: (s) => s.location.search });
  useEffect(() => {
    const path = pagePath(pathname);
    const seo = pageSeo(path, lang);
    const origin = siteOrigin();
    const explicitLang = Boolean(langFromQuery(search) || langFromQuery(searchStr));
    const canonical = pageCanonical(origin, path, lang, explicitLang);
    const image = `${origin}${OG_IMAGE_PATH}`;
    document.title = seo.title;
    document.documentElement.lang = lang;
    upsertMeta("name", "description", seo.description);
    upsertMeta("name", "keywords", seo.keywords);
    upsertMeta("name", "robots", robotsFor(path));
    upsertMeta("name", "author", "Consciencia Bitcoin");
    upsertMeta("name", "google-site-verification", "w4NkiP98t6wqRqMRrpXgVAY4Q3n82dCclvOV4AVw9uc");
    upsertMeta("name", "geo.region", GEO.region);
    upsertMeta("name", "geo.placename", GEO.placename);
    upsertMeta("name", "geo.position", `${GEO.lat};${GEO.lon}`);
    upsertMeta("name", "ICBM", `${GEO.lat}, ${GEO.lon}`);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:alt", seo.title);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:type", "image/jpeg");
    upsertMeta("property", "og:locale", seo.ogLocale);
    upsertMeta("property", "og:locale:alternate", lang === "es" ? "en_US" : "es_UY");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", image);
    upsertLink("canonical", canonical);
    upsertLink("alternate", hreflangHref(origin, path, "es"), { hreflang: "es" });
    upsertLink("alternate", hreflangHref(origin, path, "pt"), { hreflang: "pt" });
    upsertLink("alternate", hreflangHref(origin, path, "en"), { hreflang: "en" });
    upsertLink("alternate", hreflangHref(origin, path, "x-default"), { hreflang: "x-default" });
    upsertLink("sitemap", `${origin}/sitemap.xml`);
    let ld = document.getElementById("seo-jsonld");
    if (!ld) {
      ld = document.createElement("script");
      ld.id = "seo-jsonld";
      (ld as HTMLScriptElement).type = "application/ld+json";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd(lang, origin, path, canonical));
  }, [lang, pathname, search, searchStr]);
  return null;
}

export function SeoFaq({ lang }: { lang: AppLang }) {
  const rows = FAQ[lang];
  return (
    <section id="faq-seo" className="scroll-mt-[var(--header-offset)] space-y-3" aria-labelledby="faq-seo-title">
      <h2 id="faq-seo-title" className="font-display text-2xl font-medium tracking-tight text-foreground">
        FAQ
      </h2>
      <dl className="space-y-3">
        {rows.map((f) => (
          <div key={f.q} className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)]">
            <dt className="font-medium text-foreground">{f.q}</dt>
            <dd className="mt-1 text-sm text-pretty leading-relaxed text-muted-foreground">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
