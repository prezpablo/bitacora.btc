import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { VerifyIgHow } from "./verify-ig-how";

/** Mínimo de spinner, igual en anuncio / comercio / comunidad. */
export function holdCargaSpinner(started: number) {
  const wait = Math.max(0, 700 - (Date.now() - started));
  if (wait) return new Promise<void>((r) => window.setTimeout(r, wait));
  return Promise.resolve();
}

/** Copia en el mismo gesto. El portapapeles moderno falla en varios móviles y el error no se veía. */
function copyPlain(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.width = "1px";
  area.style.height = "1px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  const box = document.querySelector(".scroll-free:not([inert])");
  const y = box instanceof HTMLElement ? box.scrollTop : 0;
  const win = window.scrollY;
  area.focus({ preventScroll: true });
  area.select();
  area.setSelectionRange(0, area.value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  if (box instanceof HTMLElement) box.scrollTop = y;
  if (window.scrollY !== win) window.scrollTo(0, win);
  return ok;
}

async function copyPlainAsync(text: string) {
  if (copyPlain(text)) return true;
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
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
  const [copied, setCopied] = useState<"code" | "post" | "fail" | "">("");
  const [sheet, setSheet] = useState("");
  const flash = useRef(0);
  const mapUrl = "https://bitacorabtc.org/mapa";

  function mark(kind: "code" | "post" | "fail") {
    window.clearTimeout(flash.current);
    setCopied(kind);
    flash.current = window.setTimeout(() => setCopied(""), 4000);
  }

  useEffect(() => {
    if (!token) return;
    let stop = false;
    void copyPlainAsync(token).then((ok) => {
      if (stop || !ok) return;
      mark("code");
    });
    return () => {
      stop = true;
    };
  }, [token]);

  function remember(kind: "code" | "post", text: string) {
    setSheet(text);
    if (copyPlain(text)) {
      mark(kind);
      return;
    }
    const clip = navigator.clipboard?.writeText(text);
    if (!clip) {
      mark("fail");
      return;
    }
    void clip.then(() => mark(kind)).catch(() => mark("fail"));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">{t("pinPostCode")}</p>
      <button
        type="button"
        onClick={() => void remember("code", token)}
        className="block w-full rounded-md bg-primary px-3 py-3 text-center font-mono text-2xl font-bold tracking-widest text-white sm:text-3xl"
        title={t("pinCopy")}
        aria-label={`${t("pinCopy")}: ${token}`}
      >
        {token}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void remember("code", token)}
          className="min-h-10 rounded-md bg-elevated px-2 py-2 text-xs font-medium leading-tight text-foreground"
        >
          {copied === "code" ? t("pinCopied") : t("pinCopy")}
        </button>
        <button
          type="button"
          onClick={() => {
            const place = (name || "").trim() || t("pinPostShop");
            void remember("post", t("pinPostBody", { name: place, url: mapUrl, code: token }));
          }}
          className="min-h-10 rounded-md bg-primary px-2 py-2 text-xs font-medium leading-tight text-white"
        >
          {copied === "post" ? t("pinCopiedPost") : t("pinCopyPost")}
        </button>
      </div>
      <p className="text-sm font-medium text-primary" role="status" aria-live="polite">
        {copied === "fail" ? t("contributeCopyFail") : copied === "post" ? t("pinCopiedPost") : copied === "code" ? t("pinCopied") : t("pinPostHint")}
      </p>
      {sheet ? (
        <textarea
          readOnly
          value={sheet}
          rows={sheet.includes("\n") ? 8 : 2}
          className="w-full rounded-md bg-elevated px-2 py-2 font-mono text-xs text-foreground"
          onFocus={(e) => e.currentTarget.select()}
        />
      ) : null}
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
