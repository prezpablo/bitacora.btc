import type { LiquidityPayload } from "@/domain";
import { cn, formatCompact, formatPct } from "@/lib/utils";
import { localeTag } from "@/lib/display";
import { useAppLang, useT } from "@/lib/i18n";
import { Sparkline } from "./spark";

function scoreKey(n: number) {
  if (n >= 75) return "liqWide" as const;
  if (n >= 50) return "liqOk" as const;
  if (n >= 30) return "liqTight" as const;
  return "liqThin" as const;
}

function formatBps(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)} bps`;
}

function formatFunding(n: number) {
  const pct = n * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(4)}%`;
}

function Metric({
  label,
  value,
  hint,
  hintClass,
}: {
  label: string;
  value: string;
  hint?: string;
  hintClass?: string;
}) {
  return (
    <div className="rounded-xl bg-elevated px-3 py-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-base tabular-nums text-foreground">{value}</p>
      {hint ? (
        <p className={cn("mt-0.5 font-mono text-sm tabular-nums", hintClass ?? "text-muted-foreground")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function LiquidityPanel({ data }: { data: LiquidityPayload | null }) {
  const t = useT();
  const lang = useAppLang();
  if (!data) return null;
  const tot1 = data ? data.depth1m.bid + data.depth1m.ask : 0;
  const bidPct = tot1 > 0 && data ? (data.depth1m.bid / tot1) * 100 : 50;
  const next =
    data?.nextFundingAt && data.nextFundingAt > Date.now()
      ? new Date(data.nextFundingAt).toLocaleTimeString(localeTag(lang), {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-foreground">{t("liqTitle")}</h2>
          <p className="text-sm text-pretty text-muted-foreground">{t("liqLead")}</p>
        </div>
        {data && data.oiSeries.length >= 2 ? (
          <Sparkline values={data.oiSeries.map((p) => p.v)} color="var(--color-ma-1d)" />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-4xl tabular-nums tracking-tight text-foreground">
            {data ? data.score : "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? t(scoreKey(data.score)) : t("liqNone")} · {t("liqScale")}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Spread {data ? formatBps(data.spreadBps) : "—"}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${data?.score ?? 0}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric
          label={t("liqDepth")}
          value={data ? `${formatCompact(tot1)} USD` : "—"}
          hint={
            data
              ? `Bid ${formatCompact(data.depth1m.bid)} · ask ${formatCompact(data.depth1m.ask)}`
              : ""
          }
        />
        <Metric
          label={t("liqImb")}
          value={data ? `${(data.imbalance * 100).toFixed(1)}% bid` : "—"}
          hint={data && data.imbalance >= 0.5 ? t("liqMoreBid") : t("liqMoreAsk")}
          hintClass={data && data.imbalance >= 0.5 ? "text-long" : "text-short"}
        />
        <Metric
          label={t("liqFunding")}
          value={data ? formatFunding(data.funding) : "—"}
          hint={next ? `próximo ${next}` : "OKX"}
          hintClass={
            data ? (data.funding >= 0 ? "text-long" : "text-short") : undefined
          }
        />
        <Metric
          label={t("liqOi")}
          value={data ? `${formatCompact(data.openInterestUsd)} USD` : "—"}
          hint={data?.oiDelta != null ? `${formatPct(data.oiDelta, 1)} 24h` : ""}
          hintClass={
            data?.oiDelta != null
              ? data.oiDelta >= 0
                ? "text-long"
                : "text-short"
              : undefined
          }
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric
          label={t("liqBase")}
          value={data ? formatBps(data.basisBps) : "—"}
          hint={t("liqHintBasis")}
        />
        <Metric
          label={t("liqVol")}
          value={data ? `${formatCompact(data.volume24h)} USD` : "—"}
          hint={t("liqHintVol")}
        />
        <Metric
          label={t("liqBook")}
          value={data ? `${data.coverBps.toFixed(1)} bps` : "—"}
          hint={t("liqHintBook")}
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>{t("liqBids")}</span>
          <span>{t("liqAsks")}</span>
        </div>
        <div className="grid h-2 grid-cols-2 overflow-hidden rounded-full bg-elevated">
          <div className="flex justify-end">
            <div className="h-full bg-long" style={{ width: `${bidPct}%` }} />
          </div>
          <div className="flex justify-start">
            <div className="h-full bg-short" style={{ width: `${100 - bidPct}%` }} />
          </div>
        </div>
      </div>

      {data && data.fundingSeries.length >= 2 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t("fundPeriods")}</p>
          <Sparkline
            values={data.fundingSeries.map((p) => p.v)}
            color={data.funding >= 0 ? "var(--color-long)" : "var(--color-short)"}
          />
        </div>
      ) : null}

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        El score combina spread, profundidad a ±1% e imbalance del libro. Funding positivo:
        los longs pagan a los shorts. OI subiendo con precio plano suele ser apalancamiento
        nuevo; OI cayendo, cierre de posiciones.
      </p>
    </section>
  );
}
