import type { ClarityPayload } from "@/domain";
import { formatCompact, formatPct } from "@/lib/utils";
import { Sparkline } from "./spark";

export function ClarityPanel({ data }: { data: ClarityPayload | null }) {
  const yes = data ? data.yes * 100 : null;
  const no = data ? data.no * 100 : null;
  const hist = data?.history.map((p) => p.v) ?? [];
  const first = hist[0];
  const last = hist[hist.length - 1];
  const delta =
    first != null && last != null && first !== 0 ? ((last - first) / first) * 100 : null;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-foreground">Ley CLARITY</h2>
          <p className="text-sm text-pretty text-muted-foreground">
            Probabilidad de que H.R.3633 se firme en 2026 · Polymarket
          </p>
        </div>
        {hist.length >= 2 ? (
          <Sparkline values={hist} color="var(--color-ma-1w)" />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-4xl tabular-nums tracking-tight text-foreground">
            {yes == null ? "—" : `${yes.toFixed(1)}%`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sí · se aprueba y se firma
            {delta != null ? (
              <span className="ml-2 font-mono tabular-nums">
                {formatPct(delta, 1)} 7d
              </span>
            ) : null}
          </p>
        </div>
        <p className="font-mono text-lg tabular-nums text-muted-foreground">
          {no == null ? "—" : `${no.toFixed(1)}%`} No
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${yes ?? 0}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          Vol. {data ? formatCompact(data.volume) : "—"} USD
        </span>
        <span>
          24h {data ? formatCompact(data.volume24h) : "—"}
        </span>
        <span>Cierra 31 dic 2026</span>
        {data ? (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline-offset-2 hover:underline"
          >
            Ver en Polymarket
          </a>
        ) : (
          <span>Sin datos de Polymarket</span>
        )}
      </div>
    </section>
  );
}