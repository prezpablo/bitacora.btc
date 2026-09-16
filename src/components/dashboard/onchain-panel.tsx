import type { OnchainPayload } from "@/domain";
import { cn, formatCompact, formatPct } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { Sparkline } from "./spark";

function ehLabel(eh: number) {
  if (eh >= 1000) return `${(eh / 1000).toFixed(2)} ZH/s`;
  if (eh >= 1) return `${eh.toFixed(0)} EH/s`;
  return `${(eh * 1000).toFixed(0)} PH/s`;
}

function CmpRow({
  label,
  pct,
  scale,
}: {
  label: string;
  pct: number | null;
  scale: number;
}) {
  const v = pct ?? 0;
  const frac = Math.min(Math.abs(v) / scale, 1);
  const up = v >= 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="grid h-1.5 flex-1 grid-cols-2 overflow-hidden rounded-full bg-elevated">
        <div className="flex justify-end">
          {!up && pct != null ? (
            <div
              className="h-full rounded-full bg-short"
              style={{ width: `${frac * 100}%` }}
            />
          ) : null}
        </div>
        <div className="flex justify-start">
          {up && pct != null ? (
            <div
              className="h-full rounded-full bg-long"
              style={{ width: `${frac * 100}%` }}
            />
          ) : null}
        </div>
      </div>
      <span
        className={cn(
          "w-20 text-right font-mono text-sm tabular-nums",
          pct == null ? "text-muted-foreground" : up ? "text-long" : "text-short",
        )}
      >
        {pct == null ? "—" : formatPct(pct, 1)}
      </span>
    </div>
  );
}

export function OnchainPanel({
  data,
  priceDelta,
}: {
  data: OnchainPayload | null;
  priceDelta: number | null;
}) {
  const t = useT();
  if (!data) return null;
  const scale = Math.max(
    8,
    Math.abs(priceDelta ?? 0),
    Math.abs(data?.hashrateDelta ?? 0),
    Math.abs(data?.txDelta ?? 0),
    Math.abs(data?.difficultyDelta ?? 0),
  );
  return (
    <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-foreground">{t("ocTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("ocLead")}</p>
        </div>
        {data ? (
          <Sparkline
            values={data.hashSeries.map((p) => p.v)}
            color="var(--color-ma-1d)"
          />
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric
          label={t("ocHash")}
          value={data ? ehLabel(data.hashrateEh) : "—"}
          hint={data?.hashrateDelta != null ? formatPct(data.hashrateDelta, 1) : ""}
          up={(data?.hashrateDelta ?? 0) >= 0}
        />
        <Metric
          label={t("ocDiff")}
          value={data ? formatCompact(data.difficulty) : "—"}
          hint={data?.difficultyDelta != null ? formatPct(data.difficultyDelta, 1) : ""}
          up={(data?.difficultyDelta ?? 0) >= 0}
        />
        <Metric
          label={t("ocTx")}
          value={data ? formatCompact(data.txPerDay) : "—"}
          hint={data?.txDelta != null ? formatPct(data.txDelta, 1) : ""}
          up={(data?.txDelta ?? 0) >= 0}
        />
        <Metric
          label={t("ocBlock")}
          value={data?.height ? formatCompact(data.height) : "—"}
          hint={t("ocHeight")}
        />
        <Metric
          label={t("ocFee")}
          value={data?.feeFast != null ? `${data.feeFast} sat/vB` : t("liveFeeDown")}
          hint={
            data?.feeStale
              ? t("liveFeeStale")
              : data?.feeHour != null
                ? `${data.feeHour} sat/vB 1h`
                : ""
          }
        />
        <Metric
          label={t("ocMempool")}
          value={data?.mempoolTx != null ? formatCompact(data.mempoolTx) : "—"}
          hint={data?.mempoolVsize != null ? `${(data.mempoolVsize / 1e6).toFixed(1)} vMB` : ""}
        />
        <Metric
          label={t("ocAdj")}
          value={data?.diffAdjPct != null ? `${data.diffAdjPct >= 0 ? "+" : ""}${data.diffAdjPct.toFixed(1)}%` : "—"}
          hint={data?.blocksToAdj != null ? t("ocBlocks", { n: data.blocksToAdj }) : ""}
          up={(data?.diffAdjPct ?? 0) >= 0}
        />
      </div>

      <div className="mt-4 space-y-2">
        <CmpRow label={t("ocPrice")} pct={priceDelta} scale={scale} />
        <CmpRow label={t("ocHash")} pct={data?.hashrateDelta ?? null} scale={scale} />
        <CmpRow label={t("ocTx")} pct={data?.txDelta ?? null} scale={scale} />
        <CmpRow label={t("ocDiff")} pct={data?.difficultyDelta ?? null} scale={scale} />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  up,
}: {
  label: string;
  value: string;
  hint?: string;
  up?: boolean;
}) {
  return (
    <div className="rounded-xl bg-elevated px-3 py-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-base tabular-nums text-foreground">{value}</p>
      {hint ? (
        <p
          className={cn(
            "mt-0.5 font-mono text-sm tabular-nums",
            hint.startsWith("+") || hint.startsWith("-")
              ? up
                ? "text-long"
                : "text-short"
              : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}