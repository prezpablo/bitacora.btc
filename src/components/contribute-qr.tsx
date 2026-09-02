import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SRC = "/contribuir-qr.png";

export function ContributeQr({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const titleId = useId();

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "group text-left",
        compact ? "inline-flex items-center gap-2" : "flex shrink-0 flex-col items-center gap-2",
      )}
      aria-expanded={open}
      aria-controls={titleId}
    >
      <img
        src={SRC}
        alt={t("contributeAlt")}
        width={compact ? 44 : 168}
        height={compact ? 44 : 168}
        className={cn(
          "rounded-md bg-card shadow-[var(--shadow-border)] transition-transform duration-[var(--motion-quick)] group-hover:scale-[1.03]",
          compact ? "size-11" : "size-36 sm:size-40",
        )}
      />
      {compact ? (
        <span className="hidden text-sm font-medium text-foreground sm:inline">{t("contribute")}</span>
      ) : (
        <span className="max-w-40 text-center text-sm text-pretty text-muted-foreground">{t("contributeCaption")}</span>
      )}
    </button>
  );

  const layer =
    open && ready
      ? createPortal(
          <button
            type="button"
            aria-label={t("closeQr")}
            onClick={() => setOpen(false)}
            className="flex cursor-pointer flex-col items-center justify-center bg-background/90 p-4"
            style={{ position: "fixed", inset: 0, zIndex: 2147483646 }}
          >
            <img
              src={SRC}
              alt={t("contributeAlt")}
              width={520}
              height={520}
              className="w-full max-w-[min(92vw,28rem)] rounded-md bg-card shadow-[var(--shadow-border)]"
            />
            <p
              id={titleId}
              className="mt-4 max-w-sm text-center text-base text-pretty text-foreground sm:text-lg"
            >
              {t("contributeCaption")}
            </p>
            <p className="mt-2 max-w-sm text-center text-xs text-pretty text-muted-foreground">{t("contributeAddrNote")}</p>
          </button>,
          document.body,
        )
      : null;

  return (
    <>
      {compact ? (
        trigger
      ) : (
        <section className="flex flex-wrap items-center gap-4 rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:gap-6 sm:p-5">
          {trigger}
          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-wide text-primary uppercase">{t("payRail")}</p>
            <h2 className="mt-1 font-display text-xl font-medium text-foreground sm:text-2xl">
              {t("contributeTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-pretty text-muted-foreground sm:text-base">
              {t("contributeHint")}
            </p>
            <p className="mt-2 max-w-xl text-xs text-pretty text-muted-foreground">{t("contributeAddrNote")}</p>
          </div>
        </section>
      )}
      {layer}
    </>
  );
}
