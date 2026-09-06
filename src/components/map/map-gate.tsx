import { lazy, Suspense, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { GlobeFocus } from "@/domain/globe";
import { prefetchGlobe, prefetchMapStore } from "@/lib/map-query";
import { slowNet } from "@/lib/net";

const WorldGlobe = lazy(() => import("./world-globe").then((m) => ({ default: m.WorldGlobe })));
const SpendMap = lazy(() => import("./spend-map").then((m) => ({ default: m.SpendMap })));

function MapFallback() {
  return (
    <div className="flex h-[min(70dvh,640px)] items-center justify-center rounded-lg bg-[#0b0d10] text-sm text-neutral-400">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">₿</span>
    </div>
  );
}

export function MapGate({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"globe" | "map">(slowNet() ? "map" : "globe");
  const [focus, setFocus] = useState<GlobeFocus | undefined>();
  const [ready, setReady] = useState(slowNet());

  useEffect(() => {
    if (slowNet()) {
      setMode("map");
      setReady(true);
      void prefetchMapStore(qc);
      return;
    }
    const start = () => {
      setReady(true);
      void prefetchGlobe(qc);
      void prefetchMapStore(qc);
    };
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(start, { timeout: 600 });
      return () => window.cancelIdleCallback(id);
    }
    const n = window.setTimeout(start, 80);
    return () => window.clearTimeout(n);
  }, [qc]);

  function goMap(next?: GlobeFocus) {
    if (next) setFocus(next);
    setMode("map");
    void prefetchMapStore(qc);
  }

  if (!ready) return <MapFallback />;

  if (mode === "globe") {
    return (
      <Suspense fallback={<MapFallback />}>
        <WorldGlobe onEnter={(f) => goMap(f)} onSkip={() => goMap()} />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<MapFallback />}>
      <SpendMap focus={focus} onWorld={() => setMode("globe")} embedded={embedded} />
    </Suspense>
  );
}