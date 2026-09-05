import { useQuery, useQueryClient, keepPreviousData, type QueryClient } from "@tanstack/react-query";
import type { GlobeStats } from "@/domain/globe";
import type { EventBoardQuery } from "@/domain";
import {
  getBtcCommunities,
  getGlobeStats,
  getMapCsv,
  getMerchants,
  getNetworkEvents,
} from "@/infrastructure/server-fns";

export type MapBbox = { west: number; south: number; east: number; north: number };

export const mapKeys = {
  root: ["map"] as const,
  globe: ["map", "globe"] as const,
  geo: ["map", "geo"] as const,
  merchantsRoot: ["map", "merchants"] as const,
  merchants: (b: MapBbox) =>
    ["map", "merchants", b.west.toFixed(3), b.south.toFixed(3), b.east.toFixed(3), b.north.toFixed(3)] as const,
  communities: ["map", "communities"] as const,
  csv: ["map", "csv"] as const,
  eventsRoot: ["map", "events"] as const,
  events: (q: EventBoardQuery = {}) =>
    ["map", "events", q.page ?? 1, q.dir ?? "asc", q.continent ?? "", q.country ?? "", q.countryName ?? "", q.platform ?? "", q.kind ?? ""] as const,
};

const STALE = {
  globe: 60_000,
  geo: 24 * 60 * 60_000,
  merchants: 60_000,
  communities: 6 * 60 * 60_000,
  csv: 60_000,
  events: 10 * 60_000,
};

export function useGlobeStats() {
  return useQuery({
    queryKey: mapKeys.globe,
    queryFn: () => getGlobeStats(),
    staleTime: STALE.globe,
  });
}

export function useMapCommunities() {
  return useQuery({
    queryKey: mapKeys.communities,
    queryFn: () => getBtcCommunities(),
    staleTime: STALE.communities,
  });
}

export function useMapMerchants(bbox: MapBbox) {
  return useQuery({
    queryKey: mapKeys.merchants(bbox),
    queryFn: () => getMerchants({ data: bbox }),
    staleTime: STALE.merchants,
  });
}

export function useMapCsv() {
  return useQuery({
    queryKey: mapKeys.csv,
    queryFn: () => getMapCsv(),
    staleTime: STALE.csv,
  });
}

export function useMapEvents(query: EventBoardQuery = {}) {
  return useQuery({
    queryKey: mapKeys.events(query),
    queryFn: () => getNetworkEvents({ data: query }),
    staleTime: STALE.events,
    refetchInterval: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function prefetchGlobe(qc: QueryClient) {
  return qc.prefetchQuery({ queryKey: mapKeys.globe, queryFn: () => getGlobeStats(), staleTime: STALE.globe });
}

export function prefetchEventPage(qc: QueryClient, query: EventBoardQuery = {}) {
  return qc.prefetchQuery({
    queryKey: mapKeys.events(query),
    queryFn: () => getNetworkEvents({ data: query }),
    staleTime: STALE.events,
  });
}

export function prefetchMapStore(qc: QueryClient) {
  return Promise.all([
    prefetchGlobe(qc),
    qc.prefetchQuery({ queryKey: mapKeys.communities, queryFn: () => getBtcCommunities(), staleTime: STALE.communities }),
    qc.prefetchQuery({ queryKey: mapKeys.csv, queryFn: () => getMapCsv(), staleTime: STALE.csv }),
    prefetchEventPage(qc),
  ]);
}

export function invalidateMapWrite(qc: QueryClient, csv?: string) {
  if (csv) qc.setQueryData(mapKeys.csv, csv);
  return Promise.all([
    qc.invalidateQueries({ queryKey: mapKeys.csv }),
    qc.invalidateQueries({ queryKey: mapKeys.globe }),
    qc.invalidateQueries({ queryKey: mapKeys.merchantsRoot }),
    qc.invalidateQueries({ queryKey: mapKeys.communities }),
  ]);
}

export function countryFromGlobe(data: GlobeStats | undefined, iso?: string) {
  if (!data || !iso) return null;
  return data.countries.find((c) => c.iso === iso.toUpperCase()) ?? null;
}

export function useMapStore() {
  const qc = useQueryClient();
  return { qc, prefetch: () => prefetchMapStore(qc), invalidate: (csv?: string) => invalidateMapWrite(qc, csv) };
}
