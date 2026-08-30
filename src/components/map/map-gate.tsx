import { lazy, Suspense, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { GlobeFocus } from "@/domain/globe";
import { prefetchMapStore } from "@/lib/map-query";

const WorldGlobe = lazy(() => import("./world-globe").then((m) => ({ default: m.WorldGlobe })));
const SpendMap = lazy(() => import("./spend-map").then((m) => ({ default: m.SpendMap })));

function MapFallback() {
  return <div className="flex h-[min(70dvh,640px)] items-center justify-center rounded-lg bg-white text-sm text-neutral-500">…</div>;
}

export function MapGate({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"globe" | "map">("globe");
  const [focus, setFocus] = useState<GlobeFocus | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    void prefetchMapStore(qc);
  }, [qc]);

  function goMap(next?: GlobeFocus) {
    if (next) setFocus(next);
    setMode("map");
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
