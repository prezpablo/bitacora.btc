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

export const SAME_AS = [
  "https://github.com/prezpablo/bitacora.btc",
  "https://www.instagram.com/latamcriptomom/",
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

export const FAQ: Record<AppLang, { q: string; a: string }[]> = {
  es: [
    {
      q: "¿Qué es Bitácora.btc?",
      a: "Bitácora.btc es un espacio abierto y colaborativo para comunidades bitcoiner de Latinoamérica: un mapa interactivo de nodos, comercios que aceptan Bitcoin, eventos y educación. Lo impulsa Consciencia Bitcoin desde Colonia del Sacramento, Uruguay, con LATAM Cripto Mom.",
    },
    {
      q: "¿Dónde encuentro comunidades Bitcoin cerca de mí?",
      a: "En el mapa de Bitácora.btc. Pedí tu ubicación o buscá por ciudad, comercio o comunidad. El globo muestra totales por país; al hacer zoom ves pines de comercios y comunidades verificadas.",
    },
    {
      q: "¿Cómo sumo mi comunidad o comercio al mapa?",
      a: "En el mapa, proponé un punto, cargá nombre, descripción, redes y un logo. Publicá el código CARGA-XXXX en tu web o red; un scraper lo verifica y prende la estrella naranja. También se verifica con dos redes públicas o con nota ≥ 4 y tres votos.",
    },
    {
      q: "¿Bitácora.btc es una empresa o un exchange?",
      a: "Ninguna de las dos. Es una bitácora comunitaria, sin custodia de fondos. Educación, mapa y datos públicos de la red Bitcoin. No vendemos cuentas ni guardamos tus llaves.",
    },
  ],
  en: [
    {
      q: "What is Bitácora.btc?",
      a: "Bitácora.btc is an open collaborative space for bitcoiner communities in Latin America: an interactive map of nodes, Bitcoin-accepting merchants, events and education. It is run by Consciencia Bitcoin from Colonia del Sacramento, Uruguay, with LATAM Cripto Mom.",
    },
    {
      q: "Where do I find Bitcoin communities near me?",
      a: "On the Bitácora.btc map. Allow location or search by city, merchant or community. The globe shows country totals; zooming reveals verified merchant and community pins.",
    },
    {
      q: "How do I add my community or shop to the map?",
      a: "On the map, drop a pin, add name, description, socials and a logo. Publish the CARGA-XXXX code on your site or socials; a scraper verifies it and lights the orange star. Two public networks or a rating ≥ 4 with three votes also verify.",
    },
    {
      q: "Is Bitácora.btc a company or an exchange?",
      a: "Neither. It is a community logbook with no custody of funds. Education, a map and public Bitcoin-network data. We do not sell accounts or hold your keys.",
    },
  ],
  pt: [
    {
      q: "O que é a Bitácora.btc?",
      a: "A Bitácora.btc é um espaço aberto e colaborativo para comunidades bitcoiner da América Latina: um mapa interativo de nós, comércios que aceitam Bitcoin, eventos e educação. É impulsionada pela Consciencia Bitcoin em Colonia del Sacramento, Uruguai, com a LATAM Cripto Mom.",
    },
    {
      q: "Onde encontro comunidades Bitcoin perto de mim?",
      a: "No mapa da Bitácora.btc. Pede a tua localização ou pesquisa por cidade, comércio ou comunidade. O globo mostra totais por país; ao fazer zoom vês os pinos verificados.",
    },
    {
      q: "Como somo a minha comunidade ou comércio ao mapa?",
      a: "No mapa, propõe um ponto, carrega nome, descrição, redes e um logo. Publica o código CARGA-XXXX na tua web ou rede; um scraper verifica e acende a estrela laranja. Também se verifica com duas redes públicas ou nota ≥ 4 com três votos.",
    },
    {
      q: "A Bitácora.btc é uma empresa ou um exchange?",
      a: "Nenhuma das duas. É uma bitácora comunitária, sem custódia de fundos. Educação, mapa e dados públicos da rede Bitcoin. Não vendemos contas nem guardamos as tuas chaves.",
    },
  ],
};

export function jsonLd(lang: AppLang, origin: string) {
  const seo = SEO[lang];
  const faqs = FAQ[lang];
  const inLanguage = lang === "pt" ? "pt-BR" : lang === "en" ? "en" : "es-UY";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#org`,
        name: SITE_NAME,
        alternateName: ["bitacora.btc", "Bitácora BTC", "Consciencia Bitcoin"],
        url: origin,
        logo: `${origin}/logos/conciencia-bitcoin.png`,
        image: `${origin}/og.jpg`,
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
        description: seo.description,
        publisher: { "@id": `${origin}/#org` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${origin}/?q={search_term_string}#mapa`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebPage",
        "@id": `${origin}/#page`,
        url: origin,
        name: seo.title,
        description: seo.description,
        inLanguage,
        isPartOf: { "@id": `${origin}/#site` },
        about: { "@id": `${origin}/#org` },
        primaryImageOfPage: `${origin}/og.jpg`,
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["#conciencia h2", "#conciencia h3", "#faq-seo"],
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${origin}/#faq`,
        inLanguage,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
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
    ],
  };
}
