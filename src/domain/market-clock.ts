/** Hora del desk. Uruguay, no la zona del VPS. */
export const MARKET_ZONE = "America/Montevideo";

export function formatMarketClock(ts: number) {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: MARKET_ZONE,
    timeZoneName: "short",
  }).format(new Date(ts));
}
