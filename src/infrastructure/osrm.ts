import { geodesicLine, type GuideMode, type GuidePt, type GuideStep } from "@/domain/guide";

export type GuidePath = GuidePt[];

export type GuideRoute = {
  path: GuidePt[];
  steps: GuideStep[];
  distance: number;
  duration: number;
  mode: GuideMode;
};

const HOST: Record<GuideMode, string> = {
  foot: "https://routing.openstreetmap.de/routed-foot",
  car: "https://routing.openstreetmap.de/routed-car",
};

const UA = "bitacora.btc/1.0 (mapa Bitcoin; +https://bitacorabtc.org)";

type OsrmStep = {
  distance?: number;
  duration?: number;
  name?: string;
  maneuver?: { type?: string; modifier?: string; location?: [number, number] };
};

function stepsFromLegs(legs: { steps?: OsrmStep[] }[] | undefined): GuideStep[] {
  const out: GuideStep[] = [];
  for (const leg of legs || []) {
    for (const st of leg.steps || []) {
      const loc = st.maneuver?.location;
      if (!loc || !Number.isFinite(loc[0]) || !Number.isFinite(loc[1])) continue;
      out.push({
        lat: loc[1],
        lon: loc[0],
        distance: Number(st.distance) || 0,
        time: Number(st.duration) || 0,
        road: String(st.name || ""),
        type: String(st.maneuver?.type || ""),
        modifier: String(st.maneuver?.modifier || ""),
      });
    }
  }
  return out;
}

async function fetchOsrmAt(host: string, profile: string, from: GuidePt, to: GuidePt, mode: GuideMode): Promise<GuideRoute> {
  const url =
    `${host}/route/v1/${profile}/${from.lon.toFixed(6)},${from.lat.toFixed(6)};` +
    `${to.lon.toFixed(6)},${to.lat.toFixed(6)}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(4_000),
  });
  if (!res.ok) throw new Error(`osrm ${res.status}`);
  const json = (await res.json()) as {
    code?: string;
    routes?: {
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: [number, number][] };
      legs?: { steps?: OsrmStep[] }[];
    }[];
  };
  if (json.code && json.code !== "Ok") throw new Error(json.code);
  const route = json.routes?.[0];
  const coords = route?.geometry?.coordinates;
  if (!coords?.length) throw new Error("empty");
  const path = coords
    .map(([lon, lat]) => ({ lat, lon }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  return {
    path,
    steps: stepsFromLegs(route?.legs),
    distance: Number(route?.distance) || 0,
    duration: Number(route?.duration) || 0,
    mode,
  };
}

async function fetchOsrmRoute(from: GuidePt, to: GuidePt, mode: GuideMode): Promise<GuideRoute> {
  return fetchOsrmAt(HOST[mode], "driving", from, to, mode);
}

async function fetchValhallaRoute(from: GuidePt, to: GuidePt, mode: GuideMode): Promise<GuideRoute> {
  const res = await fetch("https://valhalla1.openstreetmap.de/route", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(4_000),
    body: JSON.stringify({
      locations: [
        { lat: from.lat, lon: from.lon },
        { lat: to.lat, lon: to.lon },
      ],
      costing: mode === "car" ? "auto" : "pedestrian",
      shape_format: "geojson",
      directions_options: { units: "kilometers" },
    }),
  });
  if (!res.ok) throw new Error(`valhalla ${res.status}`);
  const json = (await res.json()) as {
    trip?: {
      legs?: {
        shape?: string;
        geometry?: { coordinates?: [number, number][] };
        maneuvers?: { type?: number; instruction?: string; length?: number; time?: number; lat?: number; lon?: number }[];
      }[];
      summary?: { length?: number; time?: number };
    };
  };
  const geo = json.trip?.legs?.[0]?.geometry?.coordinates;
  if (!geo?.length) throw new Error("empty");
  const path = geo.map(([lon, lat]) => ({ lat, lon })).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  const steps: GuideStep[] = [];
  for (const leg of json.trip?.legs || []) {
    for (const m of leg.maneuvers || []) {
      if (m.lat == null || m.lon == null) continue;
      steps.push({
        lat: m.lat,
        lon: m.lon,
        distance: (Number(m.length) || 0) * 1000,
        time: Number(m.time) || 0,
        road: "",
        type: String(m.instruction || "continue"),
        modifier: "",
      });
    }
  }
  return {
    path,
    steps,
    distance: (Number(json.trip?.summary?.length) || 0) * 1000,
    duration: Number(json.trip?.summary?.time) || 0,
    mode,
  };
}

export async function fetchGuidePath(from: GuidePt, to: GuidePt, mode: GuideMode): Promise<GuideRoute> {
  const order: GuideMode[] = mode === "car" ? ["car", "foot"] : ["foot", "car"];
  const jobs: Promise<GuideRoute>[] = [
    fetchOsrmRoute(from, to, order[0]),
    fetchOsrmAt("https://router.project-osrm.org", "driving", from, to, mode),
  ];
  try {
    const first = await Promise.any(jobs);
    if (first.path.length >= 2) return first;
  } catch {
    /* mirrors */
  }
  for (const m of order.slice(1)) {
    try {
      const route = await fetchOsrmRoute(from, to, m);
      if (route.path.length >= 2) return route;
    } catch {
      /* next */
    }
  }
  try {
    const route = await fetchValhallaRoute(from, to, mode);
    if (route.path.length >= 2) return route;
  } catch {
    /* geodesic */
  }
  const path = geodesicLine(from, to);
  return { path, steps: [], distance: km(from, to) * 1000, duration: 0, mode };
}

function km(a: GuidePt, b: GuidePt) {
  const dlat = (b.lat - a.lat) * 111.32;
  const dlon = (b.lon - a.lon) * 111.32 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dlat, dlon);
}
