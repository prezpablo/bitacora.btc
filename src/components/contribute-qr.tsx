import { useEffect, useId, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import {
  CONTRIBUTE_BOLT12,
  CONTRIBUTE_LN_URI,
  CONTRIBUTE_ONCHAIN,
  CONTRIBUTE_URI,
} from "@/domain/contribute";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Rail = "onchain" | "ln";

const SRC: Record<Rail, string> = {
  onchain: "/contribuir-qr.png",
  ln: "/contribuir-ln.png",
};

function copyText(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.setAttribute("aria-hidden", "true");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.width = "1px";
  ta.style.height = "1px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

function CopyRow({
  rail,
  onRail,
  centered = false,
}: {
  rail: Rail;
  onRail: (r: Rail) => void;
  centered?: boolean;
}) {
  const t = useT();
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const value = rail === "ln" ? CONTRIBUTE_BOLT12 : CONTRIBUTE_ONCHAIN;
  const href = rail === "ln" ? CONTRIBUTE_LN_URI : CONTRIBUTE_URI;

  useEffect(() => {
    setStatus("idle");
  }, [rail]);

  useEffect(() => {
    if (status === "idle") return;
    const n = window.setTimeout(() => setStatus("idle"), 2800);
    return () => window.clearTimeout(n);
  }, [status]);

  function copy(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (copyText(value)) {
      setStatus("ok");
      return;
    }
    const clip = navigator.clipboard;
    if (clip?.writeText) {
      void clip.writeText(value).then(
        () => setStatus("ok"),
        () => setStatus("fail"),
      );
      return;
    }
    setStatus("fail");
  }

  return (
    <div
      className={cn("mt-3 w-full max-w-md space-y-2", centered && "text-center")}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cn("inline-flex rounded-md bg-elevated p-0.5", centered && "mx-auto")}
        role="tablist"
        aria-label={t("payRail")}
      >
        {(["onchain", "ln"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={rail === id}
            className={cn(
              "h-7 rounded px-2.5 text-xs font-medium",
              rail === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onRail(id);
            }}
          >
            {id === "ln" ? t("contributeLightning") : t("contributeOnchain")}
          </button>
        ))}
      </div>
      <p className="break-all font-mono text-[11px] leading-snug text-foreground sm:text-xs">
        <a href={href} className="text-foreground underline-offset-2 hover:underline">
          {value}
        </a>
      </p>
      <div className={cn("flex flex-wrap items-center gap-1.5", centered && "justify-center")}>
        <button
          type="button"
          className="h-7 rounded-md bg-elevated px-2.5 text-xs font-medium text-foreground"
          onClick={copy}
        >
          {t("contributeCopy")}
        </button>
        <a href={href} className="text-xs font-medium text-foreground underline underline-offset-2">
          {rail === "ln" ? "lightning:" : "bitcoin:"}
        </a>
      </div>
      <p role="status" aria-live="polite" className="min-h-[1rem] text-xs font-medium text-primary">
        {status === "ok" ? t("contributeCopied") : status === "fail" ? t("contributeCopyFail") : "\u00a0"}
      </p>
      <p className="text-[11px] text-pretty text-muted-foreground">{rail === "ln" ? t("contributeLnNote") : t("contributeAddrNote")}</p>
    </div>
  );
}

export function ContributeQr({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [rail, setRail] = useState<Rail>("onchain");
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
        src={SRC[rail]}
        alt={rail === "ln" ? t("contributeAltLn") : t("contributeAlt")}
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex flex-col items-center justify-center bg-background/90 p-4"
            style={{ position: "fixed", inset: 0, zIndex: 2147483646 }}
            onClick={() => setOpen(false)}
          >
            <div
              className="flex w-full max-w-[min(92vw,28rem)] flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={SRC[rail]}
                alt={rail === "ln" ? t("contributeAltLn") : t("contributeAlt")}
                width={520}
                height={520}
                className="mx-auto max-h-[min(42vh,16rem)] w-auto rounded-md bg-white p-2 shadow-[var(--shadow-border)]"
              />
              <p id={titleId} className="mt-3 text-center text-sm text-pretty text-foreground">
                {t("contributeCaption")}
              </p>
              <CopyRow rail={rail} onRail={setRail} centered />
              <button
                type="button"
                className="mt-3 h-7 rounded-md bg-elevated px-2.5 text-xs font-medium text-foreground"
                onClick={() => setOpen(false)}
              >
                {t("closeQr")}
              </button>
            </div>
          </div>,
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
            <CopyRow rail={rail} onRail={setRail} />
          </div>
        </section>
      )}
      {layer}
    </>
  );
}
