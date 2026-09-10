import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useT } from "@/lib/i18n";

function isChunkMiss(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error || "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(msg);
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const t = useT();
  useEffect(() => {
    if (!isChunkMiss(error) || typeof window === "undefined") return;
    const key = "bitacora-chunk-reload";
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }
    window.location.reload();
  }, [error]);
  return (
    <main
      className={
        "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center " +
        "bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
      }
    >
      <span className="text-red-500" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">{t("errorOops")}</h1>
      <p className="max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400">
        {isChunkMiss(error) ? t("errorReload") : error.message || t("errorReload")}
      </p>
      <button
        type="button"
        className="mt-2 h-10 rounded-md bg-orange-500 px-4 text-sm font-medium text-white"
        onClick={() => window.location.reload()}
      >
        {t("errorRetry")}
      </button>
    </main>
  );
}

export function AppNotFound() {
  const t = useT();
  useEffect(() => {
    document.title = t("notFoundTitle");
  }, [t]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <h1 className="text-lg font-semibold">{t("notFoundHeading")}</h1>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">{t("notFoundLead")}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        <a href="/" className="text-sm font-medium text-orange-600 hover:underline">
          {t("notFoundHome")}
        </a>
        <a href="/mapa" className="text-sm font-medium text-orange-600 hover:underline">
          {t("notFoundMap")}
        </a>
      </div>
    </main>
  );
}
