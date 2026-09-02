import type { ClarityPayload } from "@/domain";
import { formatCompact, formatPct } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { Sparkline } from "./spark";
import { StaleStamp } from "./stale-stamp";

export function ClarityPanel({ data }: { data: ClarityPayload | null }) {
  const t = useT();
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
          <h2 className="text-base font-medium text-foreground">{t("clTitle")}</h2>
          <p className="text-sm text-pretty text-muted-foreground">{t("clLead")}</p>
          <StaleStamp asOf={data?.asOf} />
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
            {t("clYes")}
            {delta != null ? (
              <span className="ml-2 font-mono tabular-nums">
                {formatPct(delta, 1)} 7d
              </span>
            ) : null}
          </p>
        </div>
        <p className="font-mono text-lg tabular-nums text-muted-foreground">
          {no == null ? "—" : `${no.toFixed(1)}%`} {t("clNo")}
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
          {t("vol")} {data ? formatCompact(data.volume) : "—"} USD
        </span>
        <span>
          24h {data ? formatCompact(data.volume24h) : "—"}
        </span>
        <span>{t("clClose")}</span>
        {data ? (
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline-offset-2 hover:underline"
          >
            {t("clView")}
          </a>
        ) : (
          <span>{t("clEmpty")}</span>
        )}
      </div>
    </section>
  );
}