import { DAYS, daySlots, formatHours, isOpenNow, type DayKey, type TimeSlot, type WeekHours } from "@/domain/hours";
import { useT, type CopyKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DAY_COPY: Record<DayKey, CopyKey> = {
  lun: "dayLun",
  mar: "dayMar",
  mie: "dayMie",
  jue: "dayJue",
  vie: "dayVie",
  sab: "daySab",
  dom: "dayDom",
};

export function HoursEditor({
  value,
  onChange,
}: {
  value: WeekHours;
  onChange: (next: WeekHours) => void;
}) {
  const t = useT();

  function setSlots(key: DayKey, slots: TimeSlot[]) {
    onChange({ ...value, [key]: slots.length ? { slots } : { closed: true } });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("fldHours")}</p>
      {DAYS.map((d) => {
        const closed = Boolean(value[d.key]?.closed) || daySlots(value[d.key]).length === 0;
        const slots = closed ? [] : daySlots(value[d.key]);
        return (
          <div key={d.key} className="flex items-start gap-2">
            <button
              type="button"
              onClick={() =>
                setSlots(d.key, closed ? [{ open: "09:00", close: "18:00" }] : [])
              }
              className={cn(
                "mt-0.5 w-10 shrink-0 rounded-md py-1 text-center font-mono text-xs",
                closed ? "bg-elevated text-muted-foreground" : "bg-primary text-white",
              )}
              title={closed ? t("hoursCloseHint") : t("hoursOpenHint")}
            >
              {t(DAY_COPY[d.key])}
            </button>
            {closed ? (
              <span className="mt-1 text-xs text-muted-foreground">{t("closed")}</span>
            ) : (
              <div className="min-w-0 flex-1 space-y-1">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      type="time"
                      className="h-8 flex-1 rounded-md bg-elevated px-1.5 font-mono text-xs shadow-[var(--shadow-border)]"
                      value={slot.open}
                      onChange={(e) => {
                        const next = slots.map((s, n) => (n === i ? { ...s, open: e.target.value } : s));
                        setSlots(d.key, next);
                      }}
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      type="time"
                      className="h-8 flex-1 rounded-md bg-elevated px-1.5 font-mono text-xs shadow-[var(--shadow-border)]"
                      value={slot.close}
                      onChange={(e) => {
                        const next = slots.map((s, n) => (n === i ? { ...s, close: e.target.value } : s));
                        setSlots(d.key, next);
                      }}
                    />
                    {slots.length > 1 ? (
                      <button
                        type="button"
                        className="size-8 shrink-0 rounded-md text-xs text-muted-foreground"
                        onClick={() => setSlots(d.key, slots.filter((_, n) => n !== i))}
                        aria-label="–"
                      >
                        –
                      </button>
                    ) : (
                      <span className="size-8" />
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs font-medium text-primary"
                  onClick={() => setSlots(d.key, [...slots, { open: "14:00", close: "19:00" }])}
                >
                  + {t("hoursAdd")}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HoursView({ hours }: { hours: WeekHours }) {
  const t = useT();
  const open = isOpenNow(hours);
  const labels = {
    lun: t("dayLun"),
    mar: t("dayMar"),
    mie: t("dayMie"),
    jue: t("dayJue"),
    vie: t("dayVie"),
    sab: t("daySab"),
    dom: t("dayDom"),
  };
  return (
    <div className="space-y-1">
      <p className={cn("text-xs font-medium tracking-wide uppercase", open ? "text-long" : "text-short")}>
        {open ? t("openNow") : t("closedNow")}
      </p>
      <ul className="text-sm text-muted-foreground">
        {formatHours(hours, labels, t("closed").toLowerCase()).map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    </div>
  );
}
