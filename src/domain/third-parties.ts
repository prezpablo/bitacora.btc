import type { AppLang } from "@/lib/locale";

type Phrase = Record<AppLang, string>;

export type ThirdParty = {
  hosts: string[];
  name: string;
  country: Phrase;
  /** Página del proveedor que dice el país. Sin ella, no se adivina. */
  countrySource?: string;
  side: "browser" | "server" | "recipient";
  why: Phrase;
};

const US: Phrase = { es: "Estados Unidos", en: "United States", pt: "Estados Unidos" };
const UNDECLARED: Phrase = {
  es: "país no informado por el proveedor",
  en: "country not reported by the provider",
  pt: "país não informado pelo provedor",
};
const SEVERAL: Phrase = { es: "varios", en: "several", pt: "vários" };

/** Fichas de terceros. `hosts` de `browser` tienen que coincidir con la CSP, token por token. */
export const THIRD_PARTIES: ThirdParty[] = [
  {
    hosts: ["tiles.openfreemap.org"],
    name: "OpenFreeMap",
    country: { es: "Hungría", en: "Hungary", pt: "Hungria" },
    countrySource: "https://openfreemap.org/tos/",
    side: "browser",
    why: {
      es: "Teselas del mapa. También está en font-src.",
      en: "Map tiles. Also listed in font-src.",
      pt: "Telhas do mapa. Também está em font-src.",
    },
  },
  {
    hosts: ["static.btcmap.org", "*.btcmap.org", "api.btcmap.org"],
    name: "BTC Map",
    country: UNDECLARED,
    side: "browser",
    why: {
      es: "Iconos, fichas y API del directorio federado.",
      en: "Icons, listings and API of the federated directory.",
      pt: "Ícones, fichas e API do diretório federado.",
    },
  },
  {
    hosts: ["*.tile.opentopomap.org"],
    name: "OpenTopoMap",
    country: { es: "Alemania", en: "Germany", pt: "Alemanha" },
    side: "browser",
    why: {
      es: "Teselas de relieve.",
      en: "Relief tiles.",
      pt: "Telhas de relevo.",
    },
  },
  {
    hosts: ["*.tile.openstreetmap.fr"],
    name: "OpenStreetMap France",
    country: { es: "Francia", en: "France", pt: "França" },
    side: "browser",
    why: {
      es: "Teselas de calles.",
      en: "Street tiles.",
      pt: "Telhas de ruas.",
    },
  },
  {
    hosts: ["images.lumacdn.com", "*.lumacdn.com"],
    name: "Luma",
    country: US,
    side: "browser",
    why: {
      es: "Imágenes de eventos.",
      en: "Event images.",
      pt: "Imagens de eventos.",
    },
  },
  {
    hosts: ["*.meetupstatic.com"],
    name: "Meetup",
    country: US,
    side: "browser",
    why: {
      es: "Imágenes de eventos.",
      en: "Event images.",
      pt: "Imagens de eventos.",
    },
  },
  {
    hosts: ["img.evbuc.com", "cdn.evbuc.com"],
    name: "Eventbrite",
    country: US,
    side: "browser",
    why: {
      es: "Imágenes de eventos.",
      en: "Event images.",
      pt: "Imagens de eventos.",
    },
  },
  {
    hosts: ["images.unsplash.com"],
    name: "Unsplash",
    country: { es: "Canadá", en: "Canada", pt: "Canadá" },
    side: "browser",
    why: {
      es: "Imágenes de apoyo.",
      en: "Supporting images.",
      pt: "Imagens de apoio.",
    },
  },
  {
    hosts: ["get.geojs.io"],
    name: "GeoJS",
    country: UNDECLARED,
    side: "browser",
    why: {
      es: "Ciudad aproximada, solo si lo pedís.",
      en: "Approximate city, only if you ask.",
      pt: "Cidade aproximada, só se você pedir.",
    },
  },
  {
    hosts: ["nominatim.openstreetmap.org"],
    name: "Nominatim (OpenStreetMap Foundation)",
    country: { es: "Reino Unido", en: "United Kingdom", pt: "Reino Unido" },
    side: "browser",
    why: {
      es: "Direcciones a partir del pin.",
      en: "Addresses from the pin.",
      pt: "Endereços a partir do pin.",
    },
  },
  {
    hosts: ["formsubmit.co"],
    name: "FormSubmit",
    country: US,
    side: "browser",
    why: {
      es: "Reenvía el formulario de Contacto hacia Gmail. El navegador también le envía tu IP.",
      en: "Forwards the Contact form to Gmail. The browser also sends it your IP.",
      pt: "Encaminha o formulário de Contato para o Gmail. O navegador também lhe envia o seu IP.",
    },
  },
  {
    hosts: ["github.com"],
    name: "GitHub",
    country: US,
    side: "recipient",
    why: {
      es: "CSV público del mapa y de los anuncios. No lleva códigos CARGA ni correos.",
      en: "Public CSV of the map and announcements. No CARGA codes or emails.",
      pt: "CSV público do mapa e dos anúncios. Não leva códigos CARGA nem e-mails.",
    },
  },
  {
    hosts: ["mail.google.com"],
    name: "Google (Gmail)",
    country: US,
    side: "recipient",
    why: {
      es: "Buzón donde termina el Contacto. No lo llama el navegador.",
      en: "Inbox where Contact ends up. The browser does not call it.",
      pt: "Caixa onde termina o Contato. O navegador não o chama.",
    },
  },
  {
    hosts: ["translate.googleapis.com"],
    name: "Google Translate",
    country: US,
    side: "server",
    why: {
      es: "Traduce titulares. Recibe el texto, no tu IP.",
      en: "Translates headlines. It receives the text, not your IP.",
      pt: "Traduz manchetes. Recebe o texto, não o seu IP.",
    },
  },
  {
    hosts: ["api.mymemory.translated.net"],
    name: "MyMemory",
    country: { es: "Italia", en: "Italy", pt: "Itália" },
    side: "server",
    why: {
      es: "Respaldo de la traducción de titulares.",
      en: "Fallback for headline translation.",
      pt: "Reserva da tradução de manchetes.",
    },
  },
  {
    hosts: ["lingva.ml"],
    name: "Lingva",
    country: UNDECLARED,
    side: "server",
    why: {
      es: "Otro respaldo de la traducción de titulares.",
      en: "Another fallback for headline translation.",
      pt: "Outra reserva da tradução de manchetes.",
    },
  },
  {
    hosts: [],
    name: "Njalla",
    country: { es: "", en: "", pt: "" },
    side: "server",
    why: {
      es: "Servidor donde corre el sitio.",
      en: "Server that runs the site.",
      pt: "Servidor onde o site roda.",
    },
  },
  {
    hosts: [],
    name: "Cotizaciones",
    country: SEVERAL,
    side: "server",
    why: {
      es: "Binance, OKX, Coinbase, Bybit, Bitget, Gate, KuCoin, HTX, MEXC, Kraken, BingX, Hyperliquid y Yahoo Finance. Ven la IP del servidor, no la tuya.",
      en: "Binance, OKX, Coinbase, Bybit, Bitget, Gate, KuCoin, HTX, MEXC, Kraken, BingX, Hyperliquid and Yahoo Finance. They see the server IP, not yours.",
      pt: "Binance, OKX, Coinbase, Bybit, Bitget, Gate, KuCoin, HTX, MEXC, Kraken, BingX, Hyperliquid e Yahoo Finance. Veem o IP do servidor, não o seu.",
    },
  },
  {
    hosts: ["mempool.space", "blockstream.info", "blockchain.info"],
    name: "Datos on-chain",
    country: SEVERAL,
    side: "server",
    why: {
      es: "Comisiones y altura de bloque. Ven la IP del servidor, no la tuya.",
      en: "Fees and block height. They see the server IP, not yours.",
      pt: "Taxas e altura do bloco. Veem o IP do servidor, não o seu.",
    },
  },
];

const CSP_DIRS = ["font-src", "img-src", "connect-src", "form-action"];

/** Hosts https de esas directivas. Ignora 'self', data: y blob:. */
export function cspHttpsHosts(csp: string): string[] {
  const out = new Set<string>();
  for (const dir of CSP_DIRS) {
    const m = csp.match(new RegExp(`${dir}\\s+([^;]+)`));
    if (!m) continue;
    for (const tok of m[1].split(/\s+/)) {
      if (!tok.startsWith("https://")) continue;
      out.add(tok.slice("https://".length).replace(/\/$/, ""));
    }
  }
  return [...out].sort();
}

export function browserHosts(): string[] {
  return THIRD_PARTIES.filter((p) => p.side === "browser").flatMap((p) => p.hosts).sort();
}
