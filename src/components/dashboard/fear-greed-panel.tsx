import type { FearGreedPayload } from "@/domain";
import { cn } from "@/lib/utils";
import { Sparkline } from "./spark";

const LABELS: Record<string, string> = {
  "Extreme Fear": "Miedo extremo",
  Fear: "Miedo",
  Neutral: "Neutral",
  Greed: "Codicia",
  "Extreme Greed": "Codicia extrema",
};

function tone(value: number) {
  if (value <= 24) return "text-short";
  if (value <= 44) return "text-short";
  if (value <= 55) return "text-muted-foreground";
  return "text-long";
}

function fill(value: number) {
  if (value <= 44) return "bg-short";
  if (value <= 55) return "bg-muted-foreground";
  return "bg-long";
}

export function FearGreedPanel({ data }: { data: FearGreedPayload | null }) {
  const value = data?.value ?? null;
  const label = data ? (LABELS[data.classification] ?? data.classification) : "—";
  const hist = data?.history.map((p) => p.v) ?? [];
  const prev = hist.length >= 2 ? hist[hist.length - 2] : null;
  const delta = value != null && prev != null ? value - prev : null;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-foreground">Miedo / codicia</h2>
          <p className="text-sm text-pretty text-muted-foreground">
            Índice cripto de Alternative.me (CNN Fear & Greed)
          </p>
        </div>
        {hist.length >= 2 ? (
          <Sparkline values={hist} color="var(--color-ma-1m)" />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={cn("font-mono text-4xl tabular-nums tracking-tight", value == null ? "text-foreground" : tone(value))}>
            {value == null ? "—" : value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {label}
            {delta != null ? (
              <span className="ml-2 font-mono tabular-nums">
                {delta > 0 ? "+" : ""}
                {`${delta} vs ayer`}
              </span>
            ) : null}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">0 miedo · 100 codicia</p>
      </div>

      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-elevated">
        <div
          className={cn("h-full rounded-full", value == null ? "bg-foreground" : fill(value))}
          style={{ width: `${value ?? 0}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>30 días</span>
        {data ? (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline-offset-2 hover:underline"
          >
            Alternative.me
          </a>
        ) : (
          <span>Sin dato de miedo/codicia</span>
        )}
      </div>
    </section>
  );
}
