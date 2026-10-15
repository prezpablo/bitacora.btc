/// <reference lib="webworker" />
import { buildLiquidationMap } from "@/domain/liquidation";
import type { Candle, HeatBucket, LiqCluster } from "@/domain/entities";

type ZoomJob = {
  key: string;
  candles: Candle[];
  bins: number;
  maxCols: number;
  min: number;
  max: number;
  t0: number;
  t1: number;
};

const scope = self as DedicatedWorkerGlobalScope;

scope.onmessage = (ev: MessageEvent<ZoomJob>) => {
  const job = ev.data;
  if (!job?.key || !Array.isArray(job.candles)) return;
  const map = buildLiquidationMap(job.candles, {
    bins: job.bins,
    maxCols: job.maxCols,
    min: job.min,
    max: job.max,
  });
  const inView = map.heatmap.filter((col) => col.t >= job.t0 && col.t <= job.t1);
  const heatCols: HeatBucket[] = inView.length >= 2 ? inView : map.heatmap;
  let peak = 1e-9;
  const clusters: LiqCluster[] = map.clusters;
  for (const c of clusters) {
    const v = c.long + c.short;
    if (v > peak) peak = v;
  }
  scope.postMessage({
    key: job.key,
    map: { heatmap: map.heatmap, clusters, min: map.min, max: map.max },
    heatCols,
    peak: Math.max(peak * 0.92, 1e-9),
  });
};
