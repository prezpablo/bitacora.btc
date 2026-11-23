/** Un solo banner en Comunidad. Cuando cierra la fecha, entra el siguiente.
 *  Solo Bitcoin. No entra un encuentro de cripto, banca, stablecoins ni inteligencia artificial.
 *
 *  Rotación (cada dos días):
 *  1. Reemplazá la imagen 1200×630 en public/eventos/.
 *  2. Editá el objeto con `poster: true` (o sumá uno nuevo con el `end` más cercano).
 *     name, place, when (ISO 8601), end, image, alt, site, tickets y agenda (opcional).
 *  3. `end` es el último día inclusive, YYYY-MM-DD en UTC. Al día siguiente no se muestra.
 */

export type FeaturedEvent = {
  id: string;
  /** Último día inclusive (YYYY-MM-DD, UTC) en que el banner sigue visible. */
  end: string;
  /** Inicio del evento. ISO 8601 con zona, por ejemplo 2026-11-24T11:59:00-03:00. */
  when?: string;
  name?: string;
  place?: string;
  site: string;
  agenda?: string;
  tickets?: string;
  image: string;
  altKey?: "labitAlt" | "histAlt" | "beachAlt";
  /** Texto alternativo en español. Al rotar no hace falta tocar los idiomas. */
  alt?: string;
  accent: string;
  ink: string;
  /** Dos mitades y el botón de tickets al medio. El clic de la pieza va a `site`. */
  split?: boolean;
  /** Imagen arriba y, debajo, los botones del sitio. */
  poster?: boolean;
};

/** Alt en español armado desde el archivo de datos. */
export function featuredAlt(event: FeaturedEvent): string | null {
  if (event.alt) return event.alt;
  const bits = [event.name, event.place].filter((part): part is string => Boolean(part));
  return bits.length ? bits.join(", ") : null;
}

export const FEATURED_EVENTS: readonly FeaturedEvent[] = [
  {
    id: "labitconf-2026",
    end: "2026-10-31",
    site: "https://www.labitconf.com/",
    agenda: "https://www.labitconf.com/agenda",
    tickets: "https://www.labitconf.com/",
    image: "/labitconf-hodl.jpg",
    altKey: "labitAlt",
    accent: "#ABF760",
    ink: "#171616",
  },
  {
    id: "bitcoin-historico-2026",
    end: "2026-11-10",
    site: "https://bitcoinhistorico.com/",
    tickets: "https://bitcoinhistorico.com/#tickets",
    image: "/eventos/bitcoin-historico.jpg",
    altKey: "histAlt",
    accent: "#EFBC53",
    ink: "#120C08",
  },
  {
    id: "bitcoin-beach-2026",
    end: "2026-11-22",
    site: "https://www.bitcoinbeach.com/",
    tickets: "https://www.bitcoinbeach.com/",
    image: "",
    altKey: "beachAlt",
    accent: "#FE6A00",
    ink: "#101820",
    split: true,
  },
  {
    id: "lacrypta-cowork-2026-11-24",
    name: "Coworking en La Crypta",
    place: "Villanueva 1367, CABA",
    when: "2026-11-24T11:59:00-03:00",
    end: "2026-11-24",
    site: "https://eventos.lacrypta.ar/o/la-crypta/events/cowork-2026-11-24",
    tickets: "https://eventos.lacrypta.ar/o/la-crypta/events/cowork-2026-11-24#reservar",
    image: "/eventos/la-crypta-coworking-2026-11-24.png",
    alt: "Coworking en La Crypta, martes 24 de noviembre de 2026 a las 11:59, Villanueva 1367, CABA, Buenos Aires. Entrada desde 2.100 sats.",
    accent: "#D6FF3F",
    ink: "#111111",
    poster: true,
  },
];

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** El primero que todavía no cerró. */
export function pickFeatured(
  today: string,
  events: readonly FeaturedEvent[] = FEATURED_EVENTS,
): FeaturedEvent | null {
  let next: FeaturedEvent | null = null;
  for (const event of events) {
    if (event.end < today) continue;
    if (!next || event.end < next.end) next = event;
  }
  return next;
}
