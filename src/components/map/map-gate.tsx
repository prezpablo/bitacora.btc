import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { GlobeFocus } from "@/domain/globe";
import { FOUNDING_UY } from "@/domain/globe";
import { boxAround } from "@/domain";
import { onJoinMap, takeJoinIntent } from "@/application/join-map";
import { prefetchGlobe, prefetchMapPins } from "@/lib/map-query";
import { getCityFrame } from "@/infrastructure/server-fns";
import { locateBest } from "@/infrastructure/geo";
import { OFM_ORIGIN, OFM_STYLE } from "@/domain/map-tiles";
import { MapCrash } from "./map-crash";

const WorldGlobe = lazy(() => import("./world-globe").then((m) => ({ default: m.WorldGlobe })));
const SpendMap = lazy(() => import("./spend-map").then((m) => ({ default: m.SpendMap })));

const OFM = OFM_ORIGIN;
let mapEngineWarm = false;

/** DNS/TLS a teselas + chunk Leaflet mientras se ve el globo (sin pelear con eventos). */
function warmMapEngine() {
  if (typeof document === "undefined" || mapEngineWarm) return;
  mapEngineWarm = true;
  for (const href of [OFM, "https://a.tile.openstreetmap.fr"]) {
    if (!document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      document.head.appendChild(link);
    }
  }
  void import("leaflet/dist/leaflet.css");
  void import("leaflet");
  void import("maplibre-gl");
  void import("@maplibre/maplibre-gl-leaflet");
  void import("./spend-map");
  void fetch(OFM_STYLE, { mode: "cors", credentials: "omit" }).catch(() => undefined);
}

/** El chunk de react-globe.gl pesa ~1,9 MB: empezarlo ya, no a los 8 s. */
function warmGlobeEngine() {
  void import("react-globe.gl");
  void import("./world-globe");
}

function MapFallback() {
  return (
    <div className="bit-globe flex items-center justify-center rounded-lg bg-white shadow-[var(--shadow-border)]">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white sm:size-12 sm:text-xl">₿</span>
    </div>
  );
}

function mapHasPendingCarga() {
  // Si hay un CARGA a medio validar, no arrancar en el globo: se pierde el paso de la prueba.
  try {
    const raw = sessionStorage.getItem("bitacora-map-pending") || localStorage.getItem("bitacora-map-pending");
    if (!raw) return false;
    const p = JSON.parse(raw) as { id?: string; token?: string };
    return Boolean(p.id && p.token);
  } catch {
    return false;
  }
}

export function MapGate({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"globe" | "map">(mapHasPendingCarga() ? "map" : "globe");
  const [focus, setFocus] = useState<GlobeFocus | undefined>();
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    warmGlobeEngine();
    void prefetchGlobe(qc);
    if (modeRef.current === "map") {
      warmMapEngine();
      void prefetchMapPins(qc);
      return;
    }
    if (typeof requestIdleCallback === "function") {
      const idle = requestIdleCallback(() => warmMapEngine(), { timeout: 800 });
      return () => cancelIdleCallback(idle);
    }
    const t = window.setTimeout(warmMapEngine, 0);
    return () => clearTimeout(t);
  }, [qc]);

  function goMap(next?: GlobeFocus) {
    if (next) setFocus(next);
    setMode("map");
    warmMapEngine();
    void prefetchMapPins(qc);
  }

  useEffect(() => {
    async function locateThenJoin() {
      if (mapHasPendingCarga()) {
        goMap();
        return;
      }
      if (modeRef.current === "map") return;
      const cityOf = (lat: number, lon: number, zoom: number) =>
        getCityFrame({ data: { lat, lon, zoom } }).catch(() => boxAround(lat, lon));
      try {
        const city = (await locateBest(false, cityOf)).city;
        goMap({ lat: city.lat, lon: city.lon, zoom: 16, iso: city.countryCode, join: true });
      } catch {
        goMap({ lat: FOUNDING_UY.lat, lon: FOUNDING_UY.lon, zoom: 16, join: true });
      }
    }
    if (takeJoinIntent()) void locateThenJoin();
    return onJoinMap(() => {
      void locateThenJoin();
    });
  }, [qc]);

  if (mode === "globe") {
    return (
      <div className="w-full shrink-0">
        <MapCrash
          fallback={
            <Suspense fallback={<MapFallback />}>
              <SpendMap onWorld={() => setMode("globe")} embedded={embedded} />
            </Suspense>
          }
        >
          <Suspense fallback={<MapFallback />}>
            <WorldGlobe onEnter={(f) => goMap(f)} onSkip={() => goMap()} />
          </Suspense>
        </MapCrash>
      </div>
    );
  }
  return (
    <div className="w-full shrink-0">
    <MapCrash fallback={<MapFallback />}>
    <Suspense fallback={<MapFallback />}>
      <SpendMap
        focus={focus}
        onWorld={() => {
          if (!mapHasPendingCarga()) setMode("globe");
        }}
        embedded={embedded}
      />
    </Suspense>
    </MapCrash>
    </div>
  );
}
