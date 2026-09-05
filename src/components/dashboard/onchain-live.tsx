import type { OnchainPayload } from "@/domain";
import { formatCompact } from "@/lib/utils";
import { localeTag } from "@/lib/display";
import { useLocale } from "@/lib/locale";
import { useT } from "@/lib/i18n";
import { StaleStamp } from "./stale-stamp";

function ehLabel(eh: number) {
  if (eh >= 1000) return `${(eh / 1000).toFixed(2)} ZH/s`;
  if (eh >= 1) return `${eh.toFixed(1)} EH/s`;
  return `${(eh * 1000).toFixed(0)} PH/s`;
}

export function OnchainLiveBar({ data }: { data: Partial<OnchainPayload> | null }) {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  if (!data) return null;
  const mb = data.mempoolVsize != null ? data.mempoolVsize / 1e6 : null;
  const rows = [
    {
      label: t("liveBlock"),
      value: data.height ? data.height.toLocaleString(localeTag(lang)) : "—",
      warn: false,
    },
    {
      label: t("liveHash"),
      value: data.hashrateEh ? ehLabel(data.hashrateEh) : "—",
      warn: false,
    },
    {
      label: t("liveFee"),
      value: data.feeFast != null ? `${data.feeFast} ${t("liveSats")}` : t("liveFeeDown"),
      warn: Boolean(data.feeStale) || data.feeFast == null,
    },
    {
      label: t("liveMempool"),
      value:
        data.mempoolTx != null
          ? `${formatCompact(data.mempoolTx)}${mb != null ? ` · ${mb.toFixed(1)} vMB` : ""}`
          : "—",
      warn: false,
    },
    {
      label: t("liveRetarget"),
      value:
        data.diffAdjPct != null
          ? `${data.diffAdjPct >= 0 ? "+" : ""}${data.diffAdjPct.toFixed(1)}%${
              data.blocksToAdj != null ? ` · ${data.blocksToAdj}` : ""
            }`
          : "—",
      warn: false,
    },
  ];

  return (
    <section className="overflow-hidden rounded-lg bg-card shadow-[var(--shadow-border)]">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="velar-live-dot size-2 rounded-full bg-primary" />
        <h2 className="text-xs font-semibold tracking-wide text-primary uppercase">{t("liveOn")}</h2>
        <span className="text-xs text-muted-foreground">mempool</span>
        <StaleStamp asOf={data.asOf} />
        {data.feeStale || data.feeFast == null ? (
          <a href="/legal#contacto" className="ml-auto text-[11px] text-primary underline-offset-2 hover:underline">
            {t("liveFeeStale")}
          </a>
        ) : null}
      </div>
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b border-border bg-elevated/60">
            {rows.map((r) => (
              <th
                key={r.label}
                scope="col"
                className="px-3 py-1.5 text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
              >
                {r.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {rows.map((r) => (
              <td
                key={r.label}
                className={`px-3 py-2 font-mono text-[13px] tabular-nums ${r.warn ? "text-primary" : "text-foreground"}`}
              >
                {r.value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}
