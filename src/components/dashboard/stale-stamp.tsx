import { formatAgo, useT } from "@/lib/i18n";

const FRESH_MS = 20 * 60_000;

export function StaleStamp({ asOf }: { asOf?: number | null }) {
  const t = useT();
  if (!asOf) return null;
  const age = Date.now() - asOf;
  const when = formatAgo(asOf, t);
  return (
    <p className="text-xs text-muted-foreground">
      {age > FRESH_MS ? t("dataStale", { when }) : t("dataAsOf", { when })}
    </p>
  );
}
