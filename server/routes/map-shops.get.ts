import { defineEventHandler, getQuery, setHeader } from "h3";
import { fetchMerchants } from "../../src/infrastructure/btc-map";
import { thinClusterPins } from "../../src/infrastructure/shop-cluster";

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export default defineEventHandler(async (event) => {
  setHeader(event, "content-type", "application/json; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=60");
  const q = getQuery(event);
  const west = num(q.west);
  const south = num(q.south);
  const east = num(q.east);
  const north = num(q.north);
  let zoom = num(q.zoom);
  if (![west, south, east, north].every(Number.isFinite)) return [];
  if (!Number.isFinite(zoom)) zoom = 4;
  const span = Math.abs(east - west) * Math.abs(north - south);
  if (span > 80) zoom = Math.min(zoom, 6);
  let pins = thinClusterPins(await fetchMerchants({ west, south, east, north, zoom }));
  if (pins.length >= 800 && zoom > 8) {
    pins = thinClusterPins(await fetchMerchants({ west, south, east, north, zoom: 8 }));
  }
  return pins;
});
