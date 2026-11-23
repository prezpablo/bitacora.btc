/** Un solo banner en Comunidad. Cuando cierra la fecha, entra el siguiente.
 *  Solo Bitcoin. No entra un encuentro de cripto, banca, stablecoins ni inteligencia artificial.
 *  Los colores son del evento, no de Bitácora.
 *  El Zonte cierra el 21. Desde el 22 el banner es Sovereign Conference, Asunción.
 *  El 24 es la llamada semanal de La Crypta. */

export type FeaturedEvent = {
  id: string;
  end: string;
  site: string;
  agenda?: string;
  tickets?: string;
  image: string;
  altKey: "labitAlt" | "histAlt" | "beachAlt" | "sovAlt" | "cryptaAlt";
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
    end: "2026-11-21",
    site: "https://www.bitcoinbeach.com/",
    tickets: "https://www.bitcoinbeach.com/",
    image: "",
    altKey: "beachAlt",
    accent: "#FE6A00",
    ink: "#101820",
    split: true,
  },
  {
    id: "sovereign-2026",
    end: "2026-11-23",
    site: "https://sovereign-conference.com/",
    agenda: "https://sovereign-conference.com/es/#program",
    tickets: "https://www.satlantis.io/embed/events/1002890/tickets",
    image: "",
    altKey: "sovAlt",
    accent: "#f7931a",
    ink: "#0b0b0b",
  },
  {
    id: "crypta-2026-11-24",
    end: "2026-11-24",
    site: "https://lacrypta.ar/",
    tickets: "https://www.youtube.com/@LaCryptaOk/live",
    image: "",
    altKey: "cryptaAlt",
    accent: "#ff4b1f",
    ink: "#0b0b0b",
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
