import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { setStorageChoice, storageChoice, wipeExtras } from "@/lib/storage-consent";
import { useT } from "@/lib/i18n";
import { legalHref } from "@/lib/locale";
import { cn } from "@/lib/utils";

const SEEN = "bitacora-storage-seen";

export function StorageBanner() {
  const t = useT();
  const search = useRouterState({ select: (s) => s.location.searchStr ?? s.location.search });
  const [show, setShow] = useState(false);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    if (storageChoice() !== "unset") return;
    setShow(true);
    try {
      const seen = sessionStorage.getItem(SEEN) === "1";
      setCompact(seen);
      sessionStorage.setItem(SEEN, "1");
    } catch {
      setCompact(false);
    }
  }, []);
  useEffect(() => {
    const pad = !show ? "0px" : compact ? "3.25rem" : "8.5rem";
    document.documentElement.style.setProperty("--storage-pad", pad);
    return () => document.documentElement.style.setProperty("--storage-pad", "0px");
  }, [show, compact]);
  if (!show) return null;
  return (
    <aside
      id="storage-banner"
      role="region"
      aria-label={t("storeTitle")}
      data-compact={compact ? "1" : undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[85] border-t border-border bg-card shadow-[var(--shadow-border)]",
        compact ? "px-3 py-1.5 sm:px-6" : "px-4 py-3 sm:px-6",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl",
          compact ? "flex-row items-center justify-between gap-2" : "flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <p className={cn("text-pretty text-muted-foreground", compact ? "min-w-0 truncate text-xs" : "text-sm")}>
          {compact ? t("storeTitle") : t("storeLead")}
          {compact ? null : (
            <>
              {" "}
              <a href={legalHref("cookies", String(search || ""))} className="font-medium text-foreground underline underline-offset-2">
                {t("legalCookies")}
              </a>
              {" · "}
              <a href={legalHref("privacidad", String(search || ""))} className="font-medium text-foreground underline underline-offset-2">
                {t("legalPrivacy")}
              </a>
              .
            </>
          )}
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className="h-9 rounded-md bg-elevated px-3 text-sm font-medium text-foreground shadow-[var(--shadow-border)]"
            onClick={() => {
              setStorageChoice("min");
              wipeExtras();
              setShow(false);
            }}
          >
            {t("storeMin")}
          </button>
          <button
            type="button"
            className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-white"
            onClick={() => {
              setStorageChoice("ok");
              setShow(false);
            }}
          >
            {t("storeOk")}
          </button>
          {compact ? null : (
            <button
              type="button"
              className="h-9 rounded-md px-3 text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => {
                wipeExtras();
                setStorageChoice("min");
                setShow(false);
              }}
            >
              {t("storeWipe")}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
