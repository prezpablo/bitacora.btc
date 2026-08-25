import type { LiquidityPayload } from "@/domain";
import { cn, formatCompact, formatPct } from "@/lib/utils";
import { Sparkline } from "./spark";

function scoreLabel(n: number) {
  if (n >= 75) return "Amplia";
  if (n >= 50) return "Aceptable";
  if (n >= 30) return "Justa";
  return "Escasa";
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
  const tot1 = data ? data.depth1m.bid + data.depth1m.ask : 0;
  const bidPct = tot1 > 0 && data ? (data.depth1m.bid / tot1) * 100 : 50;
  const next =
    data?.nextFundingAt && data.nextFundingAt > Date.now()
      ? new Date(data.nextFundingAt).toLocaleTimeString("es-UY", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-foreground">Liquidez BTC</h2>
          <p className="text-sm text-pretty text-muted-foreground">
            Libro, interés abierto y funding · OKX perpetual
          </p>
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
            {data ? scoreLabel(data.score) : "Sin libro"} · 0 escasa · 100 amplia
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
          label="Profundidad L2"
          value={data ? `${formatCompact(tot1)} USD` : "—"}
          hint={
            data
              ? `Bid ${formatCompact(data.depth1m.bid)} · ask ${formatCompact(data.depth1m.ask)}`
              : ""
          }
        />
        <Metric
          label="Imbalance"
          value={data ? `${(data.imbalance * 100).toFixed(1)}% bid` : "—"}
          hint={data && data.imbalance >= 0.5 ? "Más demanda" : "Más oferta"}
          hintClass={data && data.imbalance >= 0.5 ? "text-long" : "text-short"}
        />
        <Metric
          label="Funding 8h"
          value={data ? formatFunding(data.funding) : "—"}
          hint={next ? `próximo ${next}` : "OKX"}
          hintClass={
            data ? (data.funding >= 0 ? "text-long" : "text-short") : undefined
          }
        />
        <Metric
          label="Open interest"
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
          label="Base mark–índice"
          value={data ? formatBps(data.basisBps) : "—"}
          hint="premio del perp"
        />
        <Metric
          label="Volumen 24h"
          value={data ? `${formatCompact(data.volume24h)} USD` : "—"}
          hint="nocional swap"
        />
        <Metric
          label="Alcance del libro"
          value={data ? `${data.coverBps.toFixed(1)} bps` : "—"}
          hint="top 400 niveles OKX"
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Bids L2</span>
          <span>Asks L2</span>
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
          <p className="text-sm text-muted-foreground">Funding 14 periodos</p>
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
