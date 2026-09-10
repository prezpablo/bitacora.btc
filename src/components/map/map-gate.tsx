import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { GlobeFocus } from "@/domain/globe";
import { FOUNDING_UY } from "@/domain/globe";
import { boxAround } from "@/domain";
import { onJoinMap, takeJoinIntent } from "@/application/join-map";
import { prefetchMapStore } from "@/lib/map-query";
import { slowNet } from "@/lib/net";
import { getCityFrame } from "@/infrastructure/server-fns";
import { locateBest } from "@/infrastructure/geo";

const WorldGlobe = lazy(() => import("./world-globe").then((m) => ({ default: m.WorldGlobe })));
const SpendMap = lazy(() => import("./spend-map").then((m) => ({ default: m.SpendMap })));

function MapFallback() {
  return (
    <div className="flex h-[min(70dvh,640px)] items-center justify-center rounded-lg bg-white shadow-[var(--shadow-border)]">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">₿</span>
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
  const [mode, setMode] = useState<"globe" | "map">(slowNet() || mapHasPendingCarga() ? "map" : "globe");
  const [focus, setFocus] = useState<GlobeFocus | undefined>();
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    void prefetchMapStore(qc);
  }, [qc]);

  function goMap(next?: GlobeFocus) {
    if (next) setFocus(next);
    setMode("map");
    void prefetchMapStore(qc);
  }

  useEffect(() => {
    async function locateThenJoin() {
      if (mapHasPendingCarga()) {
        setMode("map");
        return;
      }
      if (modeRef.current === "map") return;
      const cityOf = (lat: number, lon: number, zoom: number) =>
        getCityFrame({ data: { lat, lon, zoom } }).catch(() => boxAround(lat, lon));
      try {
        let city;
        try {
          city = (await locateBest(true, cityOf)).city;
        } catch {
          city = (await locateBest(false, cityOf)).city;
        }
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
      <Suspense fallback={<MapFallback />}>
        <WorldGlobe onEnter={(f) => goMap(f)} onSkip={() => goMap()} />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<MapFallback />}>
      <SpendMap
        focus={focus}
        onWorld={() => {
          if (!mapHasPendingCarga()) setMode("globe");
        }}
        embedded={embedded}
      />
    </Suspense>
  );
}
