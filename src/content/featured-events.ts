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
 * `credit` no es un patrocinio ni un aval. Tres casos:
 * - `{ kind: "organizer", artist, source }`: el afiche lo hizo el organizador.
 *   Se lee «Arte: {artist}».
 * - `{ kind: "bitacora", identity, source }`: el diseño es de Bitácora BTC y usa
 *   la identidad visual de `identity`. No atribuye la pieza al organizador.
 *   Se lee «Diseño: Bitácora BTC, con la identidad visual de {identity}».
 * `source` es la ficha oficial, https, sin seguimiento. Se muestra como texto.
 * - `{ kind: "image", artist, source }`: la foto es del organizador. Se lee
 *   «Imagen: {artist} (host y ruta de source)». No es un aval.
 * Imagen nueva: 1200×630, AVIF + WebP + PNG de respaldo. `src` es el respaldo.
 * Una tapa cuadrada puede ir a 640 px si el archivo original es cuadrado.
 *
 * `variant: "special"` no entra en la rotación. Se muestra arriba, aparte,
 * mientras no haya pasado `endsAt`. El destacado común sigue su turno.
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
    }
  | {
      readonly kind: "image";
      /** De quién es la foto oficial. */
      readonly artist: string;
      readonly source: string;
    };

export type FeaturedCtaLabel = {
  readonly short: LangText;
  readonly full: LangText;
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
  /** `special` se pinta arriba y no ocupa el turno del destacado común. */
  readonly variant?: "special";
  readonly hosts?: LangText;
  /** Texto corto de agenda. No es un enlace. */
  readonly program?: LangText;
  readonly cta?: {
    readonly event?: FeaturedCtaLabel;
    readonly tickets?: FeaturedCtaLabel;
    readonly agenda?: FeaturedCtaLabel;
  };
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
  {
    id: "bitdevs-bh-2026-11-25",
    lang: "pt",
    startsAt: "2026-11-25T19:00:00-03:00",
    endsAt: "2026-11-25T21:00:00-03:00",
    title: {
      es: "31º BitDevs BH",
      en: "31º BitDevs BH",
      pt: "31º BitDevs BH",
    },
    where: {
      es: "Sala 1030, Escola de Engenharia da UFMG, Rua Reitor Pires Albuquerque, 100, Belo Horizonte, Brasil",
      en: "Room 1030, Escola de Engenharia da UFMG, Rua Reitor Pires Albuquerque, 100, Belo Horizonte, Brazil",
      pt: "Sala 1030, Escola de Engenharia da UFMG, Rua Reitor Pires Albuquerque, 100, Belo Horizonte, Brasil",
    },
    place: { es: "Belo Horizonte", en: "Belo Horizonte", pt: "Belo Horizonte" },
    alt: {
      es: "Afiche de 31º BitDevs BH, seminario socrático. Miércoles 25 de noviembre de 2026, 19:00 a 21:00, Sala 1030 de la Escola de Engenharia da UFMG, Belo Horizonte.",
      en: "Poster for 31º BitDevs BH, a Socratic seminar. Wednesday 25 November 2026, 19:00–21:00, Room 1030 at Escola de Engenharia da UFMG, Belo Horizonte.",
      pt: "Cartaz do 31º BitDevs BH, seminário socrático. Quarta 25 de novembro de 2026, 19:00 às 21:00, Sala 1030 da Escola de Engenharia da UFMG, Belo Horizonte.",
    },
    credit: {
      kind: "bitacora",
      identity: "Belo Horizonte BitDevs",
      source: "https://bhbitdevs.org/",
    },
    accent: "#ff9900",
    ink: "#333333",
    image: {
      src: "/eventos/bitdevs-bh-2026-11-25-wide.png",
      avif: "/eventos/bitdevs-bh-2026-11-25-wide.avif",
      webp: "/eventos/bitdevs-bh-2026-11-25-wide.webp",
      width: 1200,
      height: 300,
    },
    links: {
      event: "https://www.meetup.com/pt-br/belo-horizonte-bitdevs/events/317255330/",
    },
  },
  {
    id: "bitdevs-sp-2026-11-26",
    lang: "pt",
    // La ficha publica el día y la casa (Vinteum), no la hora. Se oculta al empezar el 27 en São Paulo.
    endsAt: "2026-11-27T00:00:00-03:00",
    title: {
      es: "Seminário Socrático 050",
      en: "Seminário Socrático 050",
      pt: "Seminário Socrático 050",
    },
    where: {
      es: "Vinteum, São Paulo, Brasil",
      en: "Vinteum, São Paulo, Brazil",
      pt: "Vinteum, São Paulo, Brasil",
    },
    place: { es: "São Paulo", en: "São Paulo", pt: "São Paulo" },
    alt: {
      es: "Afiche de Seminário Socrático 050 de São Paulo BitDevs. Jueves 26 de noviembre de 2026, en Vinteum, São Paulo.",
      en: "Poster for Seminário Socrático 050 by São Paulo BitDevs. Thursday 26 November 2026, at Vinteum, São Paulo.",
      pt: "Cartaz do Seminário Socrático 050 de São Paulo BitDevs. Quinta 26 de novembro de 2026, na Vinteum, em São Paulo.",
    },
    credit: {
      kind: "bitacora",
      identity: "São Paulo BitDevs",
      source: "https://saopaulobitdevs.org/2026-11-26-socratic-seminar-050",
    },
    accent: "#ff9900",
    ink: "#333333",
    image: {
      src: "/eventos/bitdevs-sp-2026-11-26-wide.png",
      avif: "/eventos/bitdevs-sp-2026-11-26-wide.avif",
      webp: "/eventos/bitdevs-sp-2026-11-26-wide.webp",
      width: 1200,
      height: 300,
    },
    links: {
      event: "https://saopaulobitdevs.org/2026-11-26-socratic-seminar-050",
    },
  },
  {
    id: "bitdevs-ba-2026-11-28",
    lang: "es",
    startsAt: "2026-11-28T15:45:00-03:00",
    endsAt: "2026-11-28T18:30:00-03:00",
    title: {
      es: "BitdevsBA Seminario Socratico #16",
      en: "BitdevsBA Seminario Socratico #16",
      pt: "BitdevsBA Seminario Socratico #16",
    },
    where: {
      es: "Cafe.te, Thames 937, Buenos Aires, Argentina",
      en: "Cafe.te, Thames 937, Buenos Aires, Argentina",
      pt: "Cafe.te, Thames 937, Buenos Aires, Argentina",
    },
    place: { es: "Buenos Aires", en: "Buenos Aires", pt: "Buenos Aires" },
    alt: {
      es: "Afiche de BitdevsBA Seminario Socratico #16. Sábado 28 de noviembre de 2026, 15:45 a 18:30, Cafe.te, Thames 937, Buenos Aires.",
      en: "Poster for BitdevsBA Seminario Socratico #16. Saturday 28 November 2026, 15:45–18:30, Cafe.te, Thames 937, Buenos Aires.",
      pt: "Cartaz do BitdevsBA Seminario Socratico #16. Sábado 28 de novembro de 2026, 15:45 às 18:30, Cafe.te, Thames 937, Buenos Aires.",
    },
    credit: {
      kind: "bitacora",
      identity: "BitDevsBA",
      source: "https://bitdevsba.org/socratic-seminar-16/",
    },
    accent: "#ff9900",
    ink: "#333333",
    image: {
      src: "/eventos/bitdevs-ba-2026-11-28-wide.png",
      avif: "/eventos/bitdevs-ba-2026-11-28-wide.avif",
      webp: "/eventos/bitdevs-ba-2026-11-28-wide.webp",
      width: 1200,
      height: 300,
    },
    links: {
      event: "https://bitdevsba.org/socratic-seminar-16/",
      tickets: "https://app.evento.so/e/evt_nHFKpYNeAxpVQq1f",
    },
  },
  {
    id: "crypto-talks-2026-11-28",
    lang: "es",
    variant: "special",
    // 18:00–22:00 America/Montevideo (UTC−3 todo el año).
    // Mismos instantes que 2026-11-28T21:00:00Z y 2026-11-29T01:00:00Z.
    startsAt: "2026-11-28T18:00:00-03:00",
    endsAt: "2026-11-28T22:00:00-03:00",
    title: {
      es: "Crypto Talks: Descubriendo Bitcoin",
      en: "Crypto Talks: Descubriendo Bitcoin",
      pt: "Crypto Talks: Descubriendo Bitcoin",
    },
    where: {
      es: "World Trade Center Montevideo, Torre 4, Sala Tempus (lobby inferior), Dr. Luis Bonavita 1266, Buceo, Montevideo",
      en: "World Trade Center Montevideo, Tower 4, Sala Tempus (lower lobby), Dr. Luis Bonavita 1266, Buceo, Montevideo",
      pt: "World Trade Center Montevideo, Torre 4, Sala Tempus (saguão inferior), Dr. Luis Bonavita 1266, Buceo, Montevideo",
    },
    place: { es: "Montevideo", en: "Montevideo", pt: "Montevideo" },
    note: {
      es: "Última Crypto Talks del año. Encuentro gratuito para acercarse a Bitcoin desde cero. Entrada libre, con inscripción y cupos limitados.",
      en: "Last Crypto Talks of the year. A free gathering to approach Bitcoin from scratch. Free entry, registration required, limited places.",
      pt: "Última Crypto Talks do ano. Encontro gratuito para se aproximar do Bitcoin a partir do zero. Entrada livre, com inscrição e vagas limitadas.",
    },
    hosts: {
      es: "Organizan Descubriendo Bitcoin y Roderich's Crypto House. Participan Plugin, Fundación Bitcoin Iberoamérica (FBI) y Bitcoin for Humanity. Acompañan Geyser, Paystand y Bitcoin Beach.",
      en: "Organized by Descubriendo Bitcoin and Roderich's Crypto House. Taking part: Plugin, Fundación Bitcoin Iberoamérica (FBI), and Bitcoin for Humanity. Joined by Geyser, Paystand, and Bitcoin Beach.",
      pt: "Organizam Descubriendo Bitcoin e Roderich's Crypto House. Participam Plugin, Fundación Bitcoin Iberoamérica (FBI) e Bitcoin for Humanity. Acompanham Geyser, Paystand e Bitcoin Beach.",
    },
    program: {
      es: "Agenda: apertura Maximiliano Pérez (Plugin); Luis Canessa — FBI y LABIF; Sergio Strangis — Bitcoin para periodistas; Iván Kaleja (Bitcoin for Humanity) — economías circulares; cierre con drinks y merch.",
      en: "Agenda: opening Maximiliano Pérez (Plugin); Luis Canessa — FBI and LABIF; Sergio Strangis — Bitcoin for journalists; Iván Kaleja (Bitcoin for Humanity) — circular economies; close with drinks and merch.",
      pt: "Agenda: abertura Maximiliano Pérez (Plugin); Luis Canessa — FBI e LABIF; Sergio Strangis — Bitcoin para jornalistas; Iván Kaleja (Bitcoin for Humanity) — economias circulares; encerramento com drinks e merch.",
    },
    alt: {
      es: "Afiche de Crypto Talks: Descubriendo Bitcoin. Monedas color cobre sobre fondo oscuro, pastilla azul con sábado 28 de noviembre de 18 a 22 h, y los logos de Descubriendo Bitcoin, Roderich's y Plugin.",
      en: "Poster for Crypto Talks: Descubriendo Bitcoin. Copper-colored coins on a dark background, a blue pill reading Saturday 28 November from 18:00 to 22:00, and the logos of Descubriendo Bitcoin, Roderich's, and Plugin.",
      pt: "Cartaz de Crypto Talks: Descubriendo Bitcoin. Moedas cor de cobre sobre fundo escuro, pílula azul com sábado 28 de novembro das 18 às 22 h, e os logos de Descubriendo Bitcoin, Roderich's e Plugin.",
    },
    credit: {
      kind: "image",
      artist: "Crypto Talks / Descubriendo Bitcoin",
      source: "https://luma.com/u6dg4pio",
    },
    accent: "#2d61e6",
    ink: "#ffffff",
    image: {
      src: "/eventos/crypto-talks-2026-11-28.png",
      avif: "/eventos/crypto-talks-2026-11-28.avif",
      webp: "/eventos/crypto-talks-2026-11-28.webp",
      width: 640,
      height: 640,
    },
    links: {
      event: "https://luma.com/u6dg4pio",
      tickets: "https://luma.com/u6dg4pio",
    },
    cta: {
      tickets: {
        short: {
          es: "Inscribirse (gratis)",
          en: "Register (free)",
          pt: "Inscrever-se (grátis)",
        },
        full: {
          es: "Inscribirse (gratis) a {title}",
          en: "Register (free) for {title}",
          pt: "Inscrever-se (grátis) em {title}",
        },
      },
    },
  },
];
