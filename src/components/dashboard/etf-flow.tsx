import { useMemo, useState } from "react";
import type { EtfFlowPayload, SeriesPoint } from "@/domain";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { StaleStamp } from "./stale-stamp";
import { useParentSize } from "./use-parent-size";

function moneyM(n: number) {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}B`;
  if (abs >= 10) return `${sign}$${abs.toFixed(0)}M`;
  return `${sign}$${abs.toFixed(1)}M`;
}

function fmtDate(t: number) {
  const d = new Date(t);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

type Span = "1m" | "3m" | "all";

function sliceSpan(series: SeriesPoint[], span: Span) {
  if (span === "all" || series.length < 2) return series;
  const last = series[series.length - 1]!.t;
  const days = span === "1m" ? 32 : 95;
  const from = last - days * 86_400_000;
  const cut = series.filter((p) => p.t >= from);
  return cut.length >= 8 ? cut : series.slice(-40);
}

function FlowChart({ series }: { series: SeriesPoint[] }) {
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);
  const { ref, w, h } = useParentSize(320, 180);
  if (series.length < 2) {
    return <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t("etfEmpty")}</p>;
  }
  const padL = w < 400 ? 40 : 52;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const innerW = Math.max(40, w - padL - padR);
  const innerH = Math.max(40, h - padT - padB);
  const max = Math.max(...series.map((p) => Math.abs(p.v)), 1);
  const zeroY = padT + innerH / 2;
  const bw = Math.max(1.2, innerW / series.length - 0.6);
  const hit = hover != null ? series[hover] : series[series.length - 1]!;
  const ticks = [-max, 0, max];

  function barAt(clientX: number, el: SVGSVGElement) {
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * w;
    const i = Math.floor(((x - padL) / innerW) * series.length);
    return Math.max(0, Math.min(series.length - 1, i));
  }

  return (
    <div ref={ref} className="bit-spark relative w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="block"
        role="img"
        aria-label={t("etfTitle")}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(ev) => setHover(barAt(ev.clientX, ev.currentTarget))}
      >
        {ticks.map((v) => {
          const y = zeroY - (v / max) * (innerH / 2);
          return (
            <g key={v}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
              <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
                {moneyM(v).replace("+", "")}
              </text>
            </g>
          );
        })}
        {series.map((p, i) => {
          const x = padL + (i + 0.15) * (innerW / series.length);
          const mag = (Math.abs(p.v) / max) * (innerH / 2 - 2);
          const y = p.v >= 0 ? zeroY - mag : zeroY;
          const on = hover === i;
          return (
            <rect
              key={p.t}
              x={x}
              y={y}
              width={bw}
              height={Math.max(mag, 1)}
              rx={0.8}
              fill={p.v >= 0 ? "var(--color-long, #0ecb81)" : "var(--color-short, #f6465d)"}
              opacity={on || hover == null ? 1 : 0.35}
            />
          );
        })}
        <text x={padL} y={h - 8} className="fill-muted-foreground" fontSize={10}>
          {fmtDate(series[0]!.t)}
        </text>
        <text x={w - padR} y={h - 8} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
          {fmtDate(series[series.length - 1]!.t)}
        </text>
      </svg>
      {hit ? (
        <p className="absolute top-1 right-3 font-mono text-xs tabular-nums text-foreground">
          {fmtDate(hit.t)} · <span className={hit.v >= 0 ? "text-long" : "text-short"}>{moneyM(hit.v)}</span>
        </p>
      ) : null}
    </div>
  );
}

function keyStats(series: SeriesPoint[]) {
  if (!series.length) {
    return { net: 0, maxIn: 0, maxOut: 0, streak: 0, streakUp: true };
  }
  let net = 0;
  let maxIn = 0;
  let maxOut = 0;
  for (const p of series) {
    net += p.v;
    if (p.v > maxIn) maxIn = p.v;
    if (p.v < maxOut) maxOut = p.v;
  }
  const last = series[series.length - 1]!.v;
  const up = last >= 0;
  let streak = 0;
  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i]!.v;
    if (v === 0) continue;
    if (v >= 0 !== up) break;
    streak++;
  }
  return { net, maxIn, maxOut, streak, streakUp: up };
}

export function EtfFlowPanel({ data }: { data: EtfFlowPayload | null }) {
  const t = useT();
  const [span, setSpan] = useState<Span>("3m");
  const series = useMemo(() => sliceSpan(data?.series ?? [], span), [data?.series, span]);
  const keys = useMemo(() => keyStats(series), [series]);
  const total = useMemo(() => (data?.series ?? []).reduce((s, p) => s + p.v, 0), [data?.series]);
  const inFlow = (data?.lastUsdM ?? 0) >= 0;
  return (
    <section className="overflow-hidden rounded-lg bg-card shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <span className="velar-live-dot size-2 rounded-full bg-primary" />
        <h2 className="text-xs font-semibold tracking-wide text-primary uppercase">{t("etfTitle")}</h2>
        <span className="text-xs text-muted-foreground">
          {t("etfSource")}
          {data ? ` · ${data.lastDate}` : ""}
        </span>
        <StaleStamp asOf={data?.asOf} />
        <div className="ml-auto flex gap-1">
          {(["1m", "3m", "all"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSpan(k)}
              className={cn(
                "h-7 rounded-md px-2 font-mono text-xs",
                span === k ? "bg-primary text-white" : "bg-elevated text-muted-foreground",
              )}
            >
              {k === "1m" ? t("etf1m") : k === "3m" ? t("etf3m") : t("etfAll")}
            </button>
          ))}
        </div>
      </div>
      {data ? (
        <div className="overflow-x-auto border-b border-border">
          <table className="w-full min-w-[640px] table-fixed text-sm">
            <thead>
              <tr className="bg-elevated/60 text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-1.5">{t("etfLast")}</th>
                <th className="px-3 py-1.5">{t("etf5d")}</th>
                <th className="px-3 py-1.5">{t("etf30d")}</th>
                <th className="px-3 py-1.5">{t("etfTotal")}</th>
                <th className="px-3 py-1.5">{t("etfStreak")}</th>
                <th className="px-3 py-1.5">{t("etfMax")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-mono text-[13px] tabular-nums">
                <td className={cn("px-3 py-2", inFlow ? "text-long" : "text-short")}>
                  {moneyM(data.lastUsdM)}
                  <span className="mt-0.5 block font-sans text-[11px] text-muted-foreground">
                    {inFlow ? t("etfIn") : t("etfOut")}
                    {data.lastBtc != null ? ` · ${Math.round(data.lastBtc).toLocaleString()} BTC` : ""}
                  </span>
                </td>
                <td className={cn("px-3 py-2", data.weekUsdM >= 0 ? "text-long" : "text-short")}>{moneyM(data.weekUsdM)}</td>
                <td className={cn("px-3 py-2", data.monthUsdM >= 0 ? "text-long" : "text-short")}>{moneyM(data.monthUsdM)}</td>
                <td className={cn("px-3 py-2", total >= 0 ? "text-long" : "text-short")}>{moneyM(total)}</td>
                <td className={cn("px-3 py-2", keys.streakUp ? "text-long" : "text-short")}>
                  {keys.streak}d {keys.streakUp ? t("etfIn") : t("etfOut")}
                </td>
                <td className="px-3 py-2">
                  <span className="text-long">{moneyM(keys.maxIn)}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-short">{moneyM(keys.maxOut)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-3 py-2 text-sm text-muted-foreground">{t("etfEmpty")}</p>
      )}
      <FlowChart series={series} />
      {data?.funds.length ? (
        <ul className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
          {data.funds.slice(0, 8).map((f) => (
            <li
              key={f.ticker}
              className={cn(
                "rounded-md px-2 py-0.5 font-mono text-xs tabular-nums",
                f.usdM >= 0 ? "bg-long/15 text-long" : "bg-short/15 text-short",
              )}
            >
              {f.ticker} {moneyM(f.usdM)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
