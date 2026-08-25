import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex h-8 w-full min-w-0 items-stretch rounded-md bg-elevated p-0.5 sm:w-auto"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-full min-w-0 flex-1 rounded px-2.5 font-mono text-xs font-medium sm:flex-none sm:px-3",
              active
                ? "bg-card text-foreground shadow-[var(--shadow-border)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function MaToggles({
  enabled,
  onToggle,
}: {
  enabled: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const items = [
    { key: "ema1d", label: "1D", swatch: "bg-ma-1d" },
    { key: "ema1w", label: "1S", swatch: "bg-ma-1w" },
    { key: "ema1m", label: "1M", swatch: "bg-ma-1m" },
    { key: "ema6m", label: "6M", swatch: "bg-ma-6m" },
  ];
  return (
    <div className="flex min-w-0 items-center gap-0.5" role="group" aria-label="EMAs">
      {items.map((item) => {
        const on = enabled[item.key];
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(item.key)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-xs font-medium",
              on ? "text-foreground" : "text-muted-foreground opacity-45 hover:opacity-80",
            )}
          >
            <span className={cn("size-2 rounded-full", item.swatch)} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function HeatToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 font-mono text-xs font-semibold tracking-wide",
        on
          ? "bg-primary text-primary-foreground"
          : "bg-elevated text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", on ? "bg-primary-foreground" : "bg-muted-foreground")} />
      {on ? t("heatOn") : t("heatOff")}
    </button>
  );
}
