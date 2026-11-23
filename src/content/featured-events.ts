/**
 * Evento destacado de Comunidad.
 * Para rotarlo alcanza con este archivo y las imágenes en `public/eventos/`.
 *
 * `endsAt` es el instante en que el banner se oculta. Lleva zona explícita
 * (`Z` o `±hh:mm`). Si no hay hora de cierre, usá las 00:00 del día siguiente
 * en la zona del lugar. El banner muestra el que cierra antes y todavía no cerró.
 * Dejá los eventos viejos: así no se pisa uno que sigue vigente.
 *
 * `links` es opcional. Solo https, sin parámetros de seguimiento (utm, fbclid, gclid).
 * La imagen vive en este repo (`/eventos/…`). No se carga nada del sitio del organizador.
 * `lang` es el idioma del nombre del evento (`es`, `en` o `pt`). Si la página está
 * en otro idioma, ese nombre se marca con `lang` (WCAG 3.1.2).
 * `credit` no es un patrocinio ni un aval. Dos casos:
 * - `{ kind: "organizer", artist, source }`: el afiche lo hizo el organizador.
 *   Se lee «Arte: {artist}».
 * - `{ kind: "bitacora", identity, source }`: el diseño es de Bitácora BTC y usa
 *   la identidad visual de `identity`. No atribuye la pieza al organizador.
 *   Se lee «Diseño: Bitácora BTC, con la identidad visual de {identity}».
 * `source` es la ficha oficial, https, sin seguimiento. Se muestra como texto.
 * Imagen nueva: 1200×630, AVIF + WebP + PNG de respaldo. `src` es el respaldo.
 */

export type EventLang = "es" | "en" | "pt";

export type LangText = {
  readonly es: string;
  readonly en: string;
  readonly pt: string;
};

export type FeaturedImage = {
  readonly src: string;
  readonly avif?: string;
  readonly webp?: string;
  readonly width: number;
  readonly height: number;
};

export type FeaturedLinks = {
  readonly event?: string;
  readonly tickets?: string;
  readonly agenda?: string;
};

export type FeaturedCredit =
  | {
      readonly kind: "organizer";
      /** Quién hizo el afiche oficial. */
      readonly artist: string;
      readonly source: string;
    }
  | {
      readonly kind: "bitacora";
      /** De quién es la identidad visual. No es el autor de la pieza. */
      readonly identity: string;
      readonly source: string;
    };

export type FeaturedEvent = {
  readonly id: string;
  readonly endsAt: string;
  readonly startsAt?: string;
  readonly title: LangText;
  readonly where?: LangText;
  /** Lugar corto para la línea bajo el afiche. La dirección larga queda en `where` y en el alt. */
  readonly place?: LangText;
  readonly note?: LangText;
  readonly lang: EventLang;
  readonly alt: LangText;
  readonly credit: FeaturedCredit;
  readonly accent: string;
  readonly ink: string;
  readonly image: FeaturedImage;
  readonly links?: FeaturedLinks;
};

const BA = "Villanueva 1367, CABA, Argentina";

export const FEATURED_EVENTS: readonly FeaturedEvent[] = [
  {
    id: "labitconf-2026",
    lang: "es",
    endsAt: "2026-11-01T00:00:00Z",
    title: {
      es: "LABITCONF 26 HODL",
      en: "LABITCONF 26 HODL",
      pt: "LABITCONF 26 HODL",
    },
    alt: {
      es: "LABITCONF 26 HODL — 30 y 31 de octubre, Costa Salguero, Buenos Aires",
      en: "LABITCONF 26 HODL — October 30–31, Costa Salguero, Buenos Aires",
      pt: "LABITCONF 26 HODL — 30 e 31 de outubro, Costa Salguero, Buenos Aires",
    },
    credit: { kind: "organizer", artist: "LABITCONF", source: "https://www.labitconf.com/" },
    accent: "#ABF760",
    ink: "#171616",
    image: { src: "/labitconf-hodl.jpg", width: 1600, height: 592 },
    links: {
      event: "https://www.labitconf.com/",
      agenda: "https://www.labitconf.com/agenda",
      tickets: "https://www.labitconf.com/",
    },
  },
  {
    id: "bitcoin-historico-2026",
    lang: "es",
    endsAt: "2026-11-11T00:00:00Z",
    title: {
      es: "Bitcoin Histórico",
      en: "Bitcoin Histórico",
      pt: "Bitcoin Histórico",
    },
    alt: {
      es: "Bitcoin Histórico — 11 y 12 de noviembre, San Salvador",
      en: "Bitcoin Histórico — November 11–12, San Salvador",
      pt: "Bitcoin Histórico — 11 e 12 de novembro, San Salvador",
    },
    credit: { kind: "organizer", artist: "Bitcoin Histórico", source: "https://bitcoinhistorico.com/" },
    accent: "#EFBC53",
    ink: "#120C08",
    image: { src: "/eventos/bitcoin-historico.jpg", width: 1024, height: 576 },
    links: {
      event: "https://bitcoinhistorico.com/",
      tickets: "https://bitcoinhistorico.com/#tickets",
    },
  },
  {
    id: "bitcoin-beach-2026",
    lang: "en",
    endsAt: "2026-11-22T00:00:00Z",
    title: {
      es: "Bitcoin Beach",
      en: "Bitcoin Beach",
      pt: "Bitcoin Beach",
    },
    where: {
      es: "El Zonte, El Salvador",
      en: "El Zonte, El Salvador",
      pt: "El Zonte, El Salvador",
    },
    alt: {
      es: "Global Bitcoin Circular, 19 y 20 de noviembre, y Festival Bitcoin Beach, 21 y 22, en El Zonte",
      en: "Global Bitcoin Circular, November 19–20, and Bitcoin Beach Festival, November 21–22, in El Zonte",
      pt: "Global Bitcoin Circular, 19 e 20 de novembro, e Festival Bitcoin Beach, 21 e 22, em El Zonte",
    },
    credit: { kind: "organizer", artist: "Bitcoin Beach", source: "https://www.bitcoinbeach.com/" },
    accent: "#FE6A00",
    ink: "#101820",
    image: { src: "/eventos/beach-summit.jpg", width: 931, height: 518 },
    links: {
      event: "https://www.bitcoinbeach.com/",
    },
  },
  {
    id: "sovereign-2026",
    lang: "en",
    endsAt: "2026-11-24T00:00:00Z",
    title: {
      es: "Sovereign Conference",
      en: "Sovereign Conference",
      pt: "Sovereign Conference",
    },
    place: { es: "Asunción", en: "Asunción", pt: "Assunção" },
    alt: {
      es: "Sovereign Conference, 22 de noviembre de 2026, Espacio Mburucuyá, Asunción",
      en: "Sovereign Conference, November 22, 2026, Espacio Mburucuyá, Asunción",
      pt: "Sovereign Conference, 22 de novembro de 2026, Espacio Mburucuyá, Assunção",
    },
    credit: { kind: "organizer", artist: "Sovereign Conference", source: "https://sovereign-conference.com/es/" },
    accent: "#f7931a",
    ink: "#0b0b0b",
    image: { src: "/favicon.svg", width: 32, height: 32 },
    links: {
      event: "https://sovereign-conference.com/es/",
      agenda: "https://sovereign-conference.com/es/#program",
      tickets: "https://www.satlantis.io/embed/events/1002890/tickets",
    },
  },
  {
    id: "la-crypta-cowork-2026-11-24",
    lang: "es",
    startsAt: "2026-11-24T11:59:00-03:00",
    // No se publicó hora de cierre. Se oculta al empezar el 25 en Buenos Aires.
    endsAt: "2026-11-25T00:00:00-03:00",
    title: {
      es: "Coworking en La Crypta",
      en: "Coworking en La Crypta",
      pt: "Coworking en La Crypta",
    },
    where: { es: BA, en: BA, pt: BA },
    place: { es: "CABA", en: "CABA", pt: "CABA" },
    note: {
      es: "Desde 2.100 sats por Lightning. Cupo: 20 personas.",
      en: "From 2,100 sats over Lightning. Capacity: 20.",
      pt: "A partir de 2.100 sats por Lightning. Vagas: 20.",
    },
    alt: {
      es: "Afiche de Coworking en La Crypta. Martes 24 de noviembre de 2026, 11:59, Villanueva 1367, Buenos Aires. Bitcoin, comunidad, desde 2.100 sats.",
      en: "Poster for Coworking en La Crypta. Tuesday 24 November 2026, 11:59, Villanueva 1367, Buenos Aires. Bitcoin, community, from 2,100 sats.",
      pt: "Cartaz de Coworking en La Crypta. Terça 24 de novembro de 2026, 11:59, Villanueva 1367, Buenos Aires. Bitcoin, comunidade, a partir de 2.100 sats.",
    },
    credit: {
      kind: "bitacora",
      identity: "La Crypta",
      source: "https://eventos.lacrypta.ar/o/la-crypta/events/cowork-2026-11-24",
    },
    accent: "#C4E828",
    ink: "#141414",
    image: {
      src: "/eventos/la-crypta-cowork-2026-11-24.png",
      avif: "/eventos/la-crypta-cowork-2026-11-24.avif",
      webp: "/eventos/la-crypta-cowork-2026-11-24.webp",
      width: 1200,
      height: 630,
    },
    links: {
      event: "https://eventos.lacrypta.ar/o/la-crypta/events/cowork-2026-11-24",
      tickets: "https://eventos.lacrypta.ar/o/la-crypta/events/cowork-2026-11-24#reservar",
    },
  },
];
