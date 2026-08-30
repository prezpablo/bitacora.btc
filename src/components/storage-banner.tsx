import { useEffect, useState } from "react";
import { setStorageChoice, storageChoice, wipeExtras } from "@/lib/storage-consent";
import { useT } from "@/lib/i18n";

export function StorageBanner() {
  const t = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(storageChoice() === "unset");
  }, []);
  if (!show) return null;
  return (
    <div
      role="dialog"
      aria-label={t("storeTitle")}
      className="fixed inset-x-0 bottom-0 z-[85] border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-border)] sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-pretty text-muted-foreground">{t("storeLead")}</p>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
    </div>
  );
}
