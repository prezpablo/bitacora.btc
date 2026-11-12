/** Un solo banner en Comunidad. Cuando cierra la fecha, entra el siguiente.
 *  Solo Bitcoin. No entra un encuentro de cripto, banca, stablecoins ni inteligencia artificial.
 *  Los colores son del evento, no de Bitácora.
 *  Desde el 11 de noviembre el banner es El Zonte, partido en dos: cumbre y festival. */

export type FeaturedEvent = {
  id: string;
  end: string;
  site: string;
  agenda?: string;
  tickets?: string;
  image: string;
  altKey: "labitAlt" | "histAlt" | "beachAlt";
  accent: string;
  ink: string;
  /** Dos mitades y el botón de tickets al medio. El clic de la pieza va a `site`. */
  split?: boolean;
};

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
];

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** El primero que todavía no cerró. */
export function pickFeatured(today: string, events: readonly FeaturedEvent[] = FEATURED_EVENTS): FeaturedEvent | null {
  let next: FeaturedEvent | null = null;
  for (const event of events) {
    if (event.end < today) continue;
    if (!next || event.end < next.end) next = event;
  }
  return next;
}
