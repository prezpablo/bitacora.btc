import { createServerFn } from "@tanstack/react-start";
import type { ChartRange, CommunityFeed, DeskExtras, LiqRange, MarketPayload, MarketTick, MerchantPlace, PulsePayload } from "@/domain";
import { fetchDeskExtras, fetchLiveMarket, fetchTick } from "./compose";
import { fetchPulse } from "./extra-feeds";
import { fetchMerchants, searchCities, searchMerchants } from "./btc-map";
import { fetchCommunityFeed } from "./community-feed";
import { nominatimCity, type CityFrame } from "./geo";

export const getMarket = createServerFn({ method: "POST" })
  .validator((input: { range: ChartRange; liq: LiqRange }) => input)
  .handler(async ({ data }): Promise<MarketPayload> => {
    return await fetchLiveMarket(data.range, data.liq);
  });

export const getDeskExtras = createServerFn({ method: "POST" })
  .validator((input: { range: ChartRange }) => input)
  .handler(async ({ data }): Promise<DeskExtras> => {
    return await fetchDeskExtras(data.range);
  });

export const getTick = createServerFn({ method: "POST" }).handler(async (): Promise<MarketTick> => {
  return await fetchTick();
});

export const getPulse = createServerFn({ method: "POST" })
  .validator((input: { lang?: string }) => input)
  .handler(async ({ data }): Promise<PulsePayload> => {
    return await fetchPulse(data?.lang);
  });

export const getMerchants = createServerFn({ method: "POST" })
  .validator((input: { west: number; south: number; east: number; north: number }) => input)
  .handler(async ({ data }): Promise<MerchantPlace[]> => {
    return await fetchMerchants(data);
  });

export const searchMap = createServerFn({ method: "POST" })
  .validator((input: { q: string }) => input)
  .handler(async ({ data }): Promise<{ places: MerchantPlace[]; cities: { label: string; lat: number; lon: number }[] }> => {
    const q = data.q.trim();
    const [places, cities] = await Promise.all([searchMerchants(q), searchCities(q)]);
    return { places, cities };
  });

export const getCommunityFeed = createServerFn({ method: "POST" }).handler(async (): Promise<CommunityFeed> => {
  return await fetchCommunityFeed();
});

export const getCityFrame = createServerFn({ method: "POST" })
  .validator((input: { lat: number; lon: number }) => input)
  .handler(async ({ data }): Promise<CityFrame> => {
    return await nominatimCity(data.lat, data.lon);
  });
