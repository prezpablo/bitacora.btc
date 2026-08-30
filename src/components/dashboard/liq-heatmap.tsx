import type { MarketPayload } from "@/domain";
import { formatUsd } from "@/lib/utils";
import { useT } from "@/lib/i18n";

function r(n: number, d = 3) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function LiqHeatmap({ market }: { market: MarketPayload }) {
  const t = useT();
  const cols = market.heatmap;
  const clusters = market.clusters;
  if (!cols.length || !clusters.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {t("liqEmpty")}
      </div>
    );
  }

  const binN = clusters.length;
  const colN = cols.length;
  let maxCell = 0;
  for (const col of cols) {
    for (const b of col.bins) maxCell = Math.max(maxCell, b.long, b.short);
  }
  let maxCluster = 0;
  for (const c of clusters) maxCluster = Math.max(maxCluster, c.long, c.short);

  const pMin = clusters[0]!.price;
  const pMax = clusters[clusters.length - 1]!.price;
  const heatW = 760;
  const barX = 780;
  const barW = 70;
  const mapH = 400;
  const colW = heatW / colN;
  const binH = mapH / binN;
  const yOf = (price: number) => ((pMax - price) / Math.max(pMax - pMin, 1)) * mapH;
  const ticks = [pMax, (pMax + pMin) / 2, pMin];
  const py = yOf(market.price);

  return (
    <svg
      viewBox="0 0 920 400"
      className="h-full w-full"
      role="img"
      aria-label={t("heatAria")}
      preserveAspectRatio="none"
    >
      {cols.map((col, i) =>
        col.bins.map((bin, j) => {
          const longA = maxCell ? bin.long / maxCell : 0;
          const shortA = maxCell ? bin.short / maxCell : 0;
          const y = (binN - 1 - j) * binH;
          const cells = [];
          if (longA > 0.04) {
            cells.push(
              <rect
                key={`${i}-${j}-l`}
                x={r(i * colW)}
                y={r(y)}
                width={r(Math.max(0.6, colW - 0.3))}
                height={r(Math.max(0.6, binH - 0.2))}
                fill="var(--color-long)"
                opacity={r(0.12 + 0.88 * longA)}
              />,
            );
          }
          if (shortA > 0.04) {
            cells.push(
              <rect
                key={`${i}-${j}-s`}
                x={r(i * colW)}
                y={r(y)}
                width={r(Math.max(0.6, colW - 0.3))}
                height={r(Math.max(0.6, binH - 0.2))}
                fill="var(--color-short)"
                opacity={r(0.12 + 0.88 * shortA)}
              />,
            );
          }
          return cells;
        }),
      )}
      {clusters.map((c, j) => {
        const y = yOf(c.price) - binH / 2;
        const items = [];
        if (c.long > 0 && maxCluster) {
          items.push(
            <rect
              key={`cl-${j}`}
              x={barX}
              y={r(y)}
              width={r((c.long / maxCluster) * barW)}
              height={r(Math.max(1, binH - 0.3))}
              fill="var(--color-long)"
              opacity={r(0.25 + 0.75 * (c.long / maxCluster))}
            />,
          );
        }
        if (c.short > 0 && maxCluster) {
          items.push(
            <rect
              key={`cs-${j}`}
              x={barX}
              y={r(y)}
              width={r((c.short / maxCluster) * barW)}
              height={r(Math.max(1, binH - 0.3))}
              fill="var(--color-short)"
              opacity={r(0.25 + 0.75 * (c.short / maxCluster))}
            />,
          );
        }
        return items;
      })}
      <line
        x1={0}
        x2={850}
        y1={r(py)}
        y2={r(py)}
        stroke="var(--color-foreground)"
        strokeWidth={1}
        strokeDasharray="4 5"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={0.5}
        y={0.5}
        width={heatW - 1}
        height={mapH - 1}
        fill="none"
        stroke="var(--color-border)"
        vectorEffect="non-scaling-stroke"
      />
      {ticks.map((p) => (
        <text
          key={p}
          x={912}
          y={r(yOf(p))}
          fill="var(--color-muted-foreground)"
          fontSize="13"
          textAnchor="end"
          dominantBaseline="middle"
        >
          {formatUsd(p, 0)}
        </text>
      ))}
    </svg>
  );
}
