import type { AppLang } from "./locale";

export const SITE_NAME = "Bitácora.btc";
export const THEME = "#f7931a";
export const GEO = {
  lat: -34.4717,
  lon: -57.8443,
  city: "Colonia del Sacramento",
  region: "UY-CO",
  country: "UY",
  placename: "Colonia del Sacramento, Uruguay",
};

/** Espejo IP (respaldo). Canónica = bitacorabtc.org (Let’s Encrypt activo). */
export const LIVE_ORIGIN = "https://45.158.116.49.nip.io";
export const ORG_ORIGIN = "https://bitacorabtc.org";
export const PUBLIC_ORIGIN = ORG_ORIGIN;

/** Query para romper la caché de WhatsApp/Facebook (el jpg viejo era Velar). */
export const OG_IMAGE_PATH = "/og.jpg?v=20260903";

export const SAME_AS = [
  "https://github.com/prezpablo/bitacora.btc",
  "https://www.instagram.com/latamcriptomom/",
  "https://www.youtube.com/@latamcriptomom",
  "https://x.com/latamcriptomom",
  "https://www.tiktok.com/@latamcriptomom",
  "https://t.me/+hdBuy78MUuZiYjhh",
] as const;

export function siteOrigin() {
  return PUBLIC_ORIGIN;
}

export const SEO: Record<
  AppLang,
  { title: string; description: string; keywords: string; ogLocale: string }
> = {
  es: {
    title: "Bitácora.btc | Mapa de comunidades y comercios Bitcoin en Latinoamérica",
    description:
      "Bitácora.btc es el mapa interactivo y punto de encuentro de comunidades Bitcoin en Latinoamérica. Nodos, eventos y educación soberana. Consciencia Bitcoin, Colonia del Sacramento.",
    keywords:
      "Bitcoin, mapa Bitcoin, comunidades Bitcoin, Latinoamérica, comercios Bitcoin, Lightning, autocustodia, Consciencia Bitcoin, LATAM Cripto Mom, Colonia del Sacramento, Uruguay, LABITCONF, nodos Bitcoin",
    ogLocale: "es_UY",
  },
  en: {
    title: "Bitácora.btc | Bitcoin community and merchant map for Latin America",
    description:
      "Bitácora.btc is the interactive map and meeting point for Bitcoin communities in Latin America. Nodes, events and sovereign education. Consciencia Bitcoin, Colonia del Sacramento.",
    keywords:
      "Bitcoin, Bitcoin map, Bitcoin communities, Latin America, Bitcoin merchants, Lightning, self-custody, Consciencia Bitcoin, LATAM Cripto Mom, Colonia del Sacramento, Uruguay",
    ogLocale: "en_US",
  },
  pt: {
    title: "Bitácora.btc | Mapa de comunidades e comércios Bitcoin na América Latina",
    description:
      "A Bitácora.btc é o mapa interativo e ponto de encontro das comunidades Bitcoin na América Latina. Nós, eventos e educação soberana. Consciencia Bitcoin, Colonia del Sacramento.",
    keywords:
      "Bitcoin, mapa Bitcoin, comunidades Bitcoin, América Latina, comércios Bitcoin, Lightning, autocustódia, Consciencia Bitcoin, LATAM Cripto Mom, Colonia del Sacramento, Uruguai",
    ogLocale: "pt_BR",
  },
};

export const PAGE_SEO: Record<
  string,
  Record<AppLang, { title: string; description: string }>
> = {
  "/mapa": {
    es: {
      title: "Mapa de comercios y comunidades Bitcoin en Latinoamérica | Bitácora.btc",
      description:
        "Encontrá nodos, meetups y comercios que aceptan Bitcoin en Latam. Sumá el tuyo. Sin cuentas ni custodia. Consciencia Bitcoin, Colonia.",
    },
    en: {
      title: "Bitcoin shops and communities map for Latin America | Bitácora.btc",
      description:
        "Find nodes, meetups and Bitcoin-accepting merchants in Latam. Add yours. No accounts, no custody. Consciencia Bitcoin, Colonia.",
    },
    pt: {
      title: "Mapa de comércios e comunidades Bitcoin na América Latina | Bitácora.btc",
      description:
        "Encontre nós, meetups e comércios que aceitam Bitcoin na Latam. Some o seu. Sem contas nem custódia. Consciencia Bitcoin, Colonia.",
    },
  },
  "/legal": {
    es: {
      title: "Aviso, privacidad y cookies | Bitácora.btc",
      description:
        "Aviso legal, política de privacidad, cookies y accesibilidad de Bitácora.btc. Uruguay, Ley 18.331 y RGPD.",
    },
    en: {
      title: "Legal notice, privacy and cookies | Bitácora.btc",
      description:
        "Legal notice, privacy policy, cookies and accessibility of Bitácora.btc. Uruguay Act 18.331 and GDPR.",
    },
    pt: {
      title: "Aviso, privacidade e cookies | Bitácora.btc",
      description:
        "Aviso legal, política de privacidade, cookies e acessibilidade da Bitácora.btc. Uruguai, Lei 18.331 e RGPD.",
    },
  },
  "/labif": {
    es: {
      title: "LABIF · Bitácora.btc",
      description: "Dossier LABIF de Bitácora.btc: indicadores, soberanía de datos y comunidad Bitcoin en Colonia.",
    },
    en: {
      title: "LABIF · Bitácora.btc",
      description: "LABIF dossier for Bitácora.btc: indicators, data sovereignty and the Bitcoin community in Colonia.",
    },
    pt: {
      title: "LABIF · Bitácora.btc",
      description: "Dossier LABIF da Bitácora.btc: indicadores, soberania dos dados e comunidade Bitcoin em Colonia.",
    },
  },
};

const NOT_FOUND_SEO: Record<AppLang, { title: string; description: string }> = {
  es: {
    title: "No encontrado | Bitácora.btc",
    description: "Esa dirección no existe en Bitácora.btc.",
  },
  en: {
    title: "Not found | Bitácora.btc",
    description: "That address does not exist on Bitácora.btc.",
  },
  pt: {
    title: "Não encontrado | Bitácora.btc",
    description: "Esse endereço não existe na Bitácora.btc.",
  },
};

export function pageSeo(path: string, lang: AppLang) {
  const home = SEO[lang];
  const p = pagePath(path);
  if (p !== "/" && !PAGE_SEO[p]) return { ...home, ...NOT_FOUND_SEO[lang] };
  const extra = PAGE_SEO[p]?.[lang];
  return extra ? { ...home, ...extra } : home;
}

export const MAPA_COPY: Record<AppLang, { lead: string; how: string; where: string }> = {
  es: {
    lead: "Mapa vivo de comunidades y comercios que aceptan Bitcoin en Latinoamérica: nodos, meetups y educación soberana. Lo impulsa Consciencia Bitcoin desde Colonia del Sacramento, Uruguay, con LATAM Cripto Mom.",
    how: "Para sumar un punto: entrá al mapa, proponé el pin, cargá nombre y redes, y publicá el código CARGA en un enlace público. Sin cuentas y sin custodia de llaves.",
    where: "El globo cuenta primero Latinoamérica (Uruguay, Argentina, Brasil, Chile, Paraguay, Colombia, México y el resto de la región); BTC Map suma el mundo. Con zoom ves los pines. Filtros: todas, comercios, comunidades.",
  },
  en: {
    lead: "A live map of Bitcoin communities and merchants in Latin America: nodes, meetups and sovereign education. Run by Consciencia Bitcoin from Colonia del Sacramento, Uruguay, with LATAM Cripto Mom.",
    how: "To add a pin: open the map, drop a point, add name and socials, and publish the CARGA code on a public link. No accounts and no key custody.",
    where: "The globe counts Latin America first (Uruguay, Argentina, Brazil, Chile, Paraguay, Colombia, Mexico and the rest of the region); BTC Map adds the world. Zoom to see pins. Filters: all, shops, communities.",
  },
  pt: {
    lead: "Mapa vivo de comunidades e comércios que aceitam Bitcoin na América Latina: nós, meetups e educação soberana. Impulsionado pela Consciencia Bitcoin em Colonia del Sacramento, Uruguai, com a LATAM Cripto Mom.",
    how: "Para somar um ponto: entra no mapa, propõe o pino, carrega nome e redes, e publica o código CARGA num link público. Sem contas e sem custódia de chaves.",
    where: "O globo conta primeiro a América Latina (Uruguai, Argentina, Brasil, Chile, Paraguai, Colômbia, México e o resto da região); o BTC Map soma o mundo. Com zoom vês os pinos. Filtros: todas, comércios, comunidades.",
  },
};

/** /labif and unknown HTML routes stay out of the index. */
export function robotsFor(path: string) {
  const p = pagePath(path);
  if (p === "/labif" || (p !== "/" && !PAGE_SEO[p])) return "noindex,follow";
  return "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
}

export function pagePath(path: string) {
  if (!path || path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

export function pageAbs(origin: string, path: string) {
  const p = pagePath(path);
  return p === "/" ? `${origin}/` : `${origin}${p}`;
}

export function pageCanonical(origin: string, path: string, lang: AppLang, explicitLang: boolean) {
  const base = pageAbs(origin, path);
  return explicitLang ? `${base}?lang=${lang}` : base;
}

export function hreflangHref(origin: string, path: string, lang: AppLang | "x-default") {
  const base = pageAbs(origin, path);
  return lang === "x-default" ? base : `${base}?lang=${lang}`;
}

export const FAQ: Record<AppLang, { q: string; a: string }[]> = {
  es: [
    {
      q: "¿Qué es Bitácora.btc?",
      a: "Bitácora.btc es un espacio abierto y colaborativo para comunidades bitcoiner de Latinoamérica: un mapa interactivo de nodos, comercios que aceptan Bitcoin, eventos y educación. Lo impulsa Consciencia Bitcoin desde Colonia del Sacramento, Uruguay, con LATAM Cripto Mom.",
    },
    {
      q: "¿Dónde encuentro comunidades Bitcoin cerca de mí?",
      a: "En el mapa de Bitácora.btc. Pedí tu ubicación o buscá por ciudad, comercio o comunidad. El globo cuenta primero Latinoamérica; debajo, el total mundial de BTC Map. Al hacer zoom ves pines de comercios y comunidades verificadas.",
    },
    {
      q: "¿Cómo sumo mi comunidad o comercio al mapa?",
      a: "En el mapa, proponé un punto, cargá nombre, descripción, redes y un logo. Publicá el código CARGA-XXXX en tu web o red; un scraper lo verifica y prende la estrella naranja. También se verifica con dos redes públicas o con nota ≥ 4 y tres votos.",
    },
    {
      q: "¿Bitácora.btc es una empresa o un exchange?",
      a: "Ninguna de las dos. Es una bitácora comunitaria, sin custodia de fondos. Educación, mapa y datos públicos de la red Bitcoin. No vendemos cuentas ni guardamos tus llaves.",
    },
    {
      q: "¿Hay mapa de Bitcoin en Uruguay y el resto de Latam?",
      a: "Sí. Bitácora.btc nace en Colonia del Sacramento y cubre Latinoamérica: Montevideo, Buenos Aires, São Paulo, Santiago, Asunción, Bogotá, Ciudad de México y más. El pin de Consciencia Bitcoin está en el mapa; el resto de comercios llega de BTC Map y de cargas verificadas.",
    },
  ],
  en: [
    {
      q: "What is Bitácora.btc?",
      a: "Bitácora.btc is an open collaborative space for bitcoiner communities in Latin America: an interactive map of nodes, Bitcoin-accepting merchants, events and education. It is run by Consciencia Bitcoin from Colonia del Sacramento, Uruguay, with LATAM Cripto Mom.",
    },
    {
      q: "Where do I find Bitcoin communities near me?",
      a: "On the Bitácora.btc map. Allow location or search by city, merchant or community. The globe counts Latin America first; below, the worldwide BTC Map total. Zooming reveals verified merchant and community pins.",
    },
    {
      q: "How do I add my community or shop to the map?",
      a: "On the map, drop a pin, add name, description, socials and a logo. Publish the CARGA-XXXX code on your site or socials; a scraper verifies it and lights the orange star. Two public networks or a rating ≥ 4 with three votes also verify.",
    },
    {
      q: "Is Bitácora.btc a company or an exchange?",
      a: "Neither. It is a community logbook with no custody of funds. Education, a map and public Bitcoin-network data. We do not sell accounts or hold your keys.",
    },
    {
      q: "Is there a Bitcoin map for Uruguay and the rest of Latam?",
      a: "Yes. Bitácora.btc started in Colonia del Sacramento and covers Latin America: Montevideo, Buenos Aires, São Paulo, Santiago, Asunción, Bogotá, Mexico City and more. Consciencia Bitcoin is on the map; other shops come from BTC Map and verified submissions.",
    },
  ],
  pt: [
    {
      q: "O que é a Bitácora.btc?",
      a: "A Bitácora.btc é um espaço aberto e colaborativo para comunidades bitcoiner da América Latina: um mapa interativo de nós, comércios que aceitam Bitcoin, eventos e educação. É impulsionada pela Consciencia Bitcoin em Colonia del Sacramento, Uruguai, com a LATAM Cripto Mom.",
    },
    {
      q: "Onde encontro comunidades Bitcoin perto de mim?",
      a: "No mapa da Bitácora.btc. Peça sua localização ou pesquise por cidade, comércio ou comunidade. O globo conta primeiro a América Latina; abaixo, o total mundial do BTC Map. Ao dar zoom você vê os pinos verificados.",
    },
    {
      q: "Como somo a minha comunidade ou comércio ao mapa?",
      a: "No mapa, proponha um ponto, carregue nome, descrição, redes e um logo. Publique o código CARGA-XXXX no seu site ou rede; um scraper verifica e acende a estrela laranja. Também se verifica com duas redes públicas ou nota ≥ 4 com três votos.",
    },
    {
      q: "A Bitácora.btc é uma empresa ou um exchange?",
      a: "Nenhuma das duas. É uma bitácora comunitária, sem custódia de fundos. Educação, mapa e dados públicos da rede Bitcoin. Não vendemos contas nem guardamos as suas chaves.",
    },
    {
      q: "Há mapa de Bitcoin no Uruguai e no resto da Latam?",
      a: "Sim. A Bitácora.btc nasce em Colonia del Sacramento e cobre a América Latina: Montevidéu, Buenos Aires, São Paulo, Santiago, Assunção, Bogotá, Cidade do México e mais. O pin da Consciencia Bitcoin está no mapa; os outros comércios vêm do BTC Map e de cargas verificadas.",
    },
  ],
};

export function jsonLd(lang: AppLang, origin: string, path = "/", canonical?: string) {
  const seo = pageSeo(path, lang);
  const inLanguage = lang === "pt" ? "pt-BR" : lang === "en" ? "en" : "es-UY";
  const base = pageAbs(origin, path);
  const pageUrl = canonical || base;
  const home = pagePath(path) === "/";
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${origin}/#org`,
      name: SITE_NAME,
      alternateName: ["bitacora.btc", "Bitácora BTC", "Consciencia Bitcoin"],
      url: origin,
      logo: {
        "@type": "ImageObject",
        url: `${origin}/logos/conciencia-bitcoin.png`,
        contentUrl: `${origin}/logos/conciencia-bitcoin.png`,
      },
      image: {
        "@type": "ImageObject",
        url: `${origin}${OG_IMAGE_PATH}`,
        width: 1200,
        height: 630,
      },
      foundingDate: "2026",
      foundingLocation: {
        "@type": "Place",
        name: GEO.placename,
        address: {
          "@type": "PostalAddress",
          addressLocality: GEO.city,
          addressRegion: "Colonia",
          addressCountry: "UY",
        },
        geo: { "@type": "GeoCoordinates", latitude: GEO.lat, longitude: GEO.lon },
      },
      areaServed: { "@type": "Place", name: "Latin America" },
      knowsAbout: ["Bitcoin", "Lightning Network", "self-custody", "Bitcoin circular economies"],
      sameAs: [...SAME_AS],
      parentOrganization: { "@type": "Organization", name: "Consciencia Bitcoin" },
      sponsor: {
        "@type": "Organization",
        name: "LATAM Cripto Mom",
        sameAs: ["https://www.instagram.com/latamcriptomom/"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${origin}/#site`,
      url: origin,
      name: SITE_NAME,
      inLanguage: ["es", "pt", "en"],
      description: SEO[lang].description,
      publisher: { "@id": `${origin}/#org` },
    },
    {
      "@type": "WebPage",
      "@id": `${base}#page`,
      url: pageUrl,
      name: seo.title,
      description: seo.description,
      inLanguage,
      isPartOf: { "@id": `${origin}/#site` },
      about: { "@id": `${origin}/#org` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${origin}${OG_IMAGE_PATH}`,
        width: 1200,
        height: 630,
      },
    },
    {
      "@type": "Place",
      "@id": `${origin}/#place`,
      name: "Consciencia Bitcoin — Colonia del Sacramento",
      address: {
        "@type": "PostalAddress",
        addressLocality: GEO.city,
        addressRegion: "Colonia",
        addressCountry: "UY",
      },
      geo: { "@type": "GeoCoordinates", latitude: GEO.lat, longitude: GEO.lon },
    },
  ];
  if (home) {
    (graph[2] as { speakable?: unknown }).speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: ["#conciencia h2", "#conciencia h3", "#faq-seo"],
    };
    graph.splice(3, 0, {
      "@type": "FAQPage",
      "@id": `${origin}/#faq`,
      url: origin,
      inLanguage,
      mainEntity: FAQ[lang].map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  if (pagePath(path) === "/mapa") {
    (graph[2] as { speakable?: unknown }).speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: ["#mapa h1", "#mapa-seo"],
    };
    graph.push({
      "@type": "Map",
      "@id": `${base}#map`,
      name: seo.title,
      url: pageUrl,
      description: seo.description,
      isPartOf: { "@id": `${origin}/#site` },
    });
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${origin}/` },
        { "@type": "ListItem", position: 2, name: seo.title, item: pageUrl },
      ],
    });
    graph.push({
      "@type": "FAQPage",
      "@id": `${base}#faq`,
      url: pageUrl,
      inLanguage,
      mainEntity: FAQ[lang].slice(0, 3).map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  if (pagePath(path) === "/legal") {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${origin}/` },
        { "@type": "ListItem", position: 2, name: seo.title, item: pageUrl },
      ],
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
