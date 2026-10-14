import { useEffect, useId, useRef, useState } from "react";
import { RefreshCw, Volume2 } from "lucide-react";
import { issueCaptcha } from "@/infrastructure/server-fns";
import { LEGAL } from "@/domain/legal-config";
import { speakChallenge } from "@/lib/captcha-speech";
import { minePow } from "@/lib/pow";
import { useAppLang, useT } from "@/lib/i18n";
import { legalHref } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { useRouterState } from "@tanstack/react-router";

const MIN_AGE_MS = 1200;

export type CaptchaTicket = { id: string; answer: string; nonce: string };

export function CaptchaBox({
  ok,
  onOk,
  onTicket,
  invalid = false,
  describedBy,
}: {
  ok: boolean;
  onOk: (v: boolean) => void;
  onTicket?: (t: CaptchaTicket | null) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const t = useT();
  const lang = useAppLang();
  const search = useRouterState({ select: (s) => s.location.searchStr ?? s.location.search });
  const uid = useId();
  const spokenId = `${uid}-spoken`;
  const altId = `${uid}-alt`;
  const failId = `${uid}-fail`;
  const [id, setId] = useState("");
  const [code, setCode] = useState("");
  const [hp, setHp] = useState("");
  const [born, setBorn] = useState(() => Date.now());
  const [fail, setFail] = useState("");
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState("");
  const [ripe, setRipe] = useState(false);
  const mineAbort = useRef<AbortController | null>(null);

  async function load() {
    mineAbort.current?.abort();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setLoading(true);
    onOk(false);
    onTicket?.(null);
    setFail("");
    setNonce("");
    setRipe(false);
    try {
      const row = await issueCaptcha();
      if (!row?.id || !row.code || !row.salt) {
        setId("");
        setCode("");
        setFail(t("captchaFail"));
        setLoading(false);
        return;
      }
      setId(row.id);
      setCode(row.code);
      setBorn(Date.now());
      setLoading(false);
      const ac = new AbortController();
      mineAbort.current = ac;
      const found = await minePow(row.salt, row.bits || 13, ac.signal);
      if (ac.signal.aborted) return;
      if (!found) {
        setFail(t("captchaFail"));
        return;
      }
      setNonce(found);
    } catch {
      setFail(t("captchaFail"));
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    return () => {
      mineAbort.current?.abort();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!code) return;
    const wait = Math.max(0, MIN_AGE_MS - (Date.now() - born));
    const timer = window.setTimeout(() => setRipe(true), wait);
    return () => window.clearTimeout(timer);
  }, [code, born]);

  function pass() {
    if (!id || !code) return;
    if (hp.trim()) {
      setFail(t("captchaFail"));
      return;
    }
    if (Date.now() - born < MIN_AGE_MS || !ripe) {
      setFail(t("captchaSlow"));
      return;
    }
    if (!nonce) {
      setFail(t("captchaSlow"));
      return;
    }
    setFail("");
    onOk(true);
    onTicket?.({ id, answer: code, nonce });
  }

  function listen() {
    if (!code || loading) return;
    if (!speakChallenge(code, lang)) setFail(t("captchaNoSpeech"));
  }

  const described = [altId, spokenId, fail ? failId : "", describedBy || ""].filter(Boolean).join(" ");

  return (
    <div className="space-y-2 rounded-md bg-elevated p-3 shadow-[var(--shadow-border)]">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("captchaTitle")}</p>
      <p id={altId} className="text-xs text-pretty text-muted-foreground">
        {t("captchaAlt")}{" "}
        <a href={legalHref("accesibilidad", String(search || ""))} className="inline-flex min-h-6 min-w-6 items-center font-medium text-foreground underline underline-offset-2">
          {t("captchaA11y")}
        </a>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex size-10 min-h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-card text-primary"
          onClick={listen}
          disabled={loading || !code}
          aria-label={t("captchaListen")}
          title={t("captchaListen")}
        >
          <Volume2 className="size-4" />
        </button>
        <button
          type="button"
          className="inline-flex size-10 min-h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-card text-primary"
          onClick={() => void load()}
          aria-label={t("captchaRefresh")}
          title={t("captchaRefresh")}
        >
          <RefreshCw className="size-4" />
        </button>
        <button
          type="button"
          className={cn(
            "h-10 min-w-6 flex-1 rounded-md px-3 text-xs font-semibold",
            ok ? "bg-long text-white" : "bg-primary text-white",
          )}
          onClick={pass}
          disabled={loading || !code || !nonce || !ripe}
          aria-describedby={described}
          aria-invalid={fail || invalid ? true : undefined}
        >
          {ok ? t("captchaOk") : nonce && ripe ? t("captchaCheck") : t("captchaPow")}
        </button>
      </div>
      <a
        href={`mailto:${LEGAL.a11yEmail}`}
        className="inline-flex min-h-6 min-w-6 items-center text-xs font-medium text-foreground underline underline-offset-2"
      >
        {t("captchaMail")}
      </a>
      <p id={spokenId} className="sr-only" aria-live="polite">
        {ok ? t("captchaOk") : nonce && ripe ? t("captchaCheck") : t("captchaPow")}
      </p>
      <label className="hidden" aria-hidden="true">
        {t("hpWeb")}
        <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />
      </label>
      {!ripe && code && !fail ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {t("captchaPow")}
        </p>
      ) : null}
      {fail ? (
        <p id={failId} role="alert" className="text-xs text-short">
          {fail}
        </p>
      ) : null}
    </div>
  );
}
