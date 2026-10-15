/**
 * Información de arquitectura de la bitácora (D-NAV).
 * El header/pie solo pintan.
 * D-NAV-01: 4 destinos.
 * D-NAV-02: Aprender = #aprender (conciencia + historia + minado + pulso).
 * D-NAV-03: Red vive dentro de Mercado.
 * D-NAV-04: Sumate del header es CTA a Telegram de Consciencia Bitcoin, no un 5º destino.
 * D-CTA: QR / Apoyá con sats vive en el pie `#aportes`, no junto a Sumate.
 */

export type NavItem = {
  id: string;
  hash: string;
  href?: string;
};

export const PRIMARY_NAV: readonly NavItem[] = [
  { id: "mapa", hash: "mapa" },
  { id: "aprender", hash: "aprender" },
  { id: "comunidad", hash: "comunidad" },
  { id: "mercado", hash: "mercado" },
];

/** Pie: rumbo y contacto. Privacidad vive en el grupo Legal. */
export const UTILITY_NAV: readonly NavItem[] = [
  { id: "hacia", hash: "roadmap" },
  { id: "contacto", hash: "contacto" },
];

/** Telegram de Consciencia Bitcoin (pie). */
export const TELEGRAM_COMMUNITY = "https://t.me/+hdBuy78MUuZiYjhh";

export const LEGAL_NAV: readonly NavItem[] = [
  { id: "privacidad", hash: "privacidad" },
  { id: "contacto", hash: "contacto" },
];

/** Tres grupos del pie (menos ruido; mismos destinos, un clic). */
export const FOOTER_PROJECT = ["mapa", "hacia", "datos", "soberania"] as const;
export const FOOTER_COMMUNITY = ["contacto", "telegram", "aportes"] as const;
export const FOOTER_LEGAL = ["aviso", "privacidad", "cookies", "accesibilidad", "terminos"] as const;

export const LEARN_HUB: readonly NavItem[] = [
  { id: "conciencia", hash: "conciencia" },
  { id: "historia", hash: "historia" },
  { id: "minado", hash: "minado" },
  { id: "pulso", hash: "pulso" },
];

/** D-NAV-03: Red vive dentro de Mercado. #red queda como ancla. */
export const MARKET_HUB: readonly NavItem[] = [
  { id: "mercado", hash: "mercado" },
  { id: "red", hash: "red" },
];

export const COMMUNITY_HUB: readonly NavItem[] = [
  { id: "anuncios", hash: "anuncios" },
  { id: "eventos", hash: "eventos" },
  { id: "experiencias", hash: "experiencias" },
  { id: "feed", hash: "feed" },
];

export type DeskSector = "llegar" | "comunidad" | "mercado" | "pie";

const LLEGAR = new Set(["", "mapa", "aprender", "conciencia", "historia", "pulso", "minado", "repaso"]);
const COMUNIDAD = new Set(["comunidad", "anuncios", "eventos", "experiencias", "feed"]);
const MERCADO = new Set(["mercado", "red"]);

export function sectorOf(hash: string): DeskSector {
  const id = hash.replace(/^#/, "");
  if (LLEGAR.has(id)) return "llegar";
  if (COMUNIDAD.has(id)) return "comunidad";
  if (MERCADO.has(id)) return "mercado";
  return "pie";
}

/** What the primary bar underlines. Pie hashes underline nothing. */
export function spyOf(hash: string): string {
  const id = hash.replace(/^#/, "") || "mapa";
  const sector = sectorOf(id);
  if (sector === "llegar") {
    if (id === "conciencia" || id === "historia" || id === "pulso" || id === "minado" || id === "aprender" || id === "repaso") return "aprender";
    return "mapa";
  }
  if (sector === "comunidad") return "comunidad";
  if (sector === "mercado") return "mercado";
  return "";
}

/**
 * Qué chip del hub está encendido.
 * En la raíz de la sala (hash vacío, el de la sala o el de entrada) queda el primero.
 * Fuera de la sala, ninguno.
 */
export function hubChipOn(hash: string, itemHash: string, fallbackHash: string, parentHash?: string): boolean {
  const id = hash.replace(/^#/, "");
  const root = id === "" || id === fallbackHash || (parentHash !== undefined && id === parentHash);
  return id === itemHash || (root && itemHash === fallbackHash);
}
