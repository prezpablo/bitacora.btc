import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { VerifyIgHow } from "./verify-ig-how";

/** Mínimo de spinner, igual en anuncio / comercio / comunidad. */
export function holdCargaSpinner(started: number) {
  const wait = Math.max(0, 700 - (Date.now() - started));
  if (wait) return new Promise<void>((r) => window.setTimeout(r, wait));
  return Promise.resolve();
}

/** Paso 2 de CARGA: el código ya salió; falta la URL pública que lo muestra. */
export function CargaProofStep({
  token,
  name,
  busy,
  err,
  onCheck,
  onCancel,
}: {
  token: string;
  name?: string;
  busy?: boolean;
  err?: string;
  onCheck: (proof: string) => void;
  onCancel?: () => void;
}) {
  const t = useT();
  const [proof, setProof] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    let stop = false;
    void navigator.clipboard.writeText(token).then(() => {
      if (stop) return;
      setCopied(true);
      window.setTimeout(() => {
        if (!stop) setCopied(false);
      }, 4000);
    }).catch(() => {});
    return () => {
      stop = true;
    };
  }, [token]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4000);
    } catch {
      /* leave the code on screen */
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">{t("pinPostCode")}</p>
      <button
        type="button"
        onClick={() => void copyCode()}
        className="block w-full rounded-md bg-primary px-3 py-3 text-center font-mono text-2xl font-bold tracking-widest text-white sm:text-3xl"
        title={t("pinCopy")}
        aria-label={`${t("pinCopy")}: ${token}`}
      >
        {token}
      </button>
      <p className="text-sm font-medium text-primary" role="status" aria-live="polite">
        {copied ? t("pinCopied") : t("pinPostHint")}
      </p>
      <VerifyIgHow />
      <label className="block text-sm">
        <span className="text-muted-foreground">{t("pinProof")}</span>
        <input
          className="mt-1 h-10 w-full rounded-md border border-border bg-background px-2"
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          placeholder={t("patchPhProof")}
          inputMode="url"
          autoComplete="url"
        />
      </label>
      {name ? <p className="truncate text-xs text-muted-foreground">{name}</p> : null}
      {err ? (
        <p className="text-sm text-primary" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="button"
        className="h-10 w-full rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-50"
        disabled={busy || !proof.trim()}
        onClick={() => onCheck(proof.trim())}
      >
        {t("pinCheck")}
      </button>
      {onCancel ? (
        <button
          type="button"
          className="h-10 w-full rounded-md bg-elevated px-3 text-sm font-medium text-foreground"
          onClick={onCancel}
        >
          {t("pinCancel")}
        </button>
      ) : null}
    </div>
  );
}

/** Spinner «Generando PIN» o el código + URL. Mismo bloque en anuncio, comercio y comunidad. */
export function CargaPendingView({
  generating,
  token,
  name,
  busy,
  err,
  onCheck,
  onCancel,
}: {
  generating?: boolean;
  token?: string;
  name?: string;
  busy?: boolean;
  err?: string;
  onCheck: (proof: string) => void;
  onCancel: () => void;
}) {
  const t = useT();
  if (generating && !token) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center gap-2" role="status" aria-live="polite" aria-busy="true">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
        <p className="font-display text-lg font-medium text-foreground">{t("pinGenerating")}</p>
      </div>
    );
  }
  if (!token) return null;
  return <CargaProofStep token={token} name={name} busy={busy} err={err} onCheck={onCheck} onCancel={onCancel} />;
}
