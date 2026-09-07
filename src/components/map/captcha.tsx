import { useEffect, useId, useMemo, useRef, useState } from "react";
import { RefreshCw, Volume2 } from "lucide-react";
import { issueCaptcha } from "@/infrastructure/server-fns";
import { speakChallenge, spokenCode } from "@/lib/captcha-speech";
import { minePow } from "@/lib/pow";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export type CaptchaTicket = { id: string; answer: string; nonce: string };

function noise(seed: number) {
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let s = seed || 1;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 7; i++) {
    out.push({
      x1: rnd() * 180,
      y1: rnd() * 56,
      x2: rnd() * 180,
      y2: rnd() * 56,
    });
  }
  return out;
}

export function CaptchaBox({
  ok,
  onOk,
  onTicket,
}: {
  ok: boolean;
  onOk: (v: boolean) => void;
  onTicket?: (t: CaptchaTicket | null) => void;
}) {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const uid = useId();
  const spokenId = `${uid}-spoken`;
  const altId = `${uid}-alt`;
  const [id, setId] = useState("");
  const [code, setCode] = useState("");
  const [typed, setTyped] = useState("");
  const [hp, setHp] = useState("");
  const [born, setBorn] = useState(() => Date.now());
  const [fail, setFail] = useState("");
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState("");
  const mineAbort = useRef<AbortController | null>(null);
  const lines = useMemo(() => noise(code.split("").reduce((a, c) => a + c.charCodeAt(0), 0)), [code]);

  async function load() {
    mineAbort.current?.abort();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setLoading(true);
    onOk(false);
    onTicket?.(null);
    setTyped("");
    setFail("");
    setNonce("");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!nonce || !id || !code) return;
    if (hp.trim()) return;
    if (typed.trim().toUpperCase() !== code) return;
    if (Date.now() - born < 400) return;
    onOk(true);
    onTicket?.({ id, answer: typed.trim().toUpperCase(), nonce });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  function pass() {
    if (!id || !code) return;
    if (hp.trim()) {
      setFail(t("captchaFail"));
      return;
    }
    if (Date.now() - born < 900) {
      setFail(t("captchaSlow"));
      return;
    }
    if (typed.trim().toUpperCase() !== code) {
      setFail(t("captchaFail"));
      void load();
      return;
    }
    if (!nonce) {
      setFail(t("captchaSlow"));
      return;
    }
    setFail("");
    onOk(true);
    onTicket?.({ id, answer: typed.trim().toUpperCase(), nonce });
  }

  function listen() {
    if (!code || loading) return;
    if (!speakChallenge(code, lang)) setFail(t("captchaNoSpeech"));
  }

  return (
    <div className="space-y-2 rounded-md bg-elevated p-3 shadow-[var(--shadow-border)]">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("captchaTitle")}</p>
      <p id={altId} className="text-xs text-pretty text-muted-foreground">
        {t("captchaAlt")}
      </p>
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 180 56" className="h-14 w-full rounded-md bg-[#1a1a1a]" aria-hidden="true">
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="#F7931A"
              strokeOpacity={0.28}
              strokeWidth={1}
            />
          ))}
          {(loading ? "·····" : code).split("").map((ch, i) => (
            <text
              key={i}
              x={22 + i * 32}
              y={36}
              fill="#F7931A"
              fontSize="26"
              fontWeight="700"
              fontFamily="ui-monospace, monospace"
              transform={`rotate(${(i % 2 === 0 ? -1 : 1) * (8 + (i * 5) % 9)} ${22 + i * 32} 32)`}
            >
              {ch}
            </text>
          ))}
        </svg>
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-card text-primary"
          onClick={listen}
          disabled={loading || !code}
          aria-label={t("captchaListen")}
          title={t("captchaListen")}
        >
          <Volume2 className="size-4" />
        </button>
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-card text-primary"
          onClick={() => void load()}
          aria-label={t("captchaRefresh")}
          title={t("captchaRefresh")}
        >
          <RefreshCw className="size-4" />
        </button>
      </div>
      <p id={spokenId} className="sr-only" aria-live="polite">
        {code && !loading ? t("captchaSpoken", { code: spokenCode(code).replaceAll(". ", ", ") }) : t("captchaPow")}
      </p>
      <label className="hidden" aria-hidden="true">
        {t("hpWeb")}
        <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <input
          className="h-10 min-w-0 flex-1 rounded-md bg-card px-3 font-mono text-sm uppercase tracking-widest shadow-[var(--shadow-border)]"
          value={typed}
          onChange={(e) => {
            const v = e.target.value;
            setTyped(v);
            const match = v.trim().toUpperCase() === code && !!code && !!nonce && !hp.trim() && Date.now() - born >= 400;
            if (match) {
              setFail("");
              onOk(true);
              onTicket?.({ id, answer: v.trim().toUpperCase(), nonce });
            } else if (ok) {
              onOk(false);
              onTicket?.(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              pass();
            }
          }}
          placeholder={t("captchaHint")}
          aria-label={t("captchaHint")}
          aria-describedby={`${altId} ${spokenId}`}
          autoComplete="off"
          spellCheck={false}
          maxLength={8}
          disabled={loading || !code}
          aria-invalid={fail ? true : undefined}
        />
        <button
          type="button"
          className={cn(
            "h-10 shrink-0 rounded-md px-3 text-xs font-semibold",
            ok ? "bg-long text-white" : "bg-primary text-white",
          )}
          onClick={pass}
          disabled={loading || !code || !nonce}
        >
          {ok ? t("captchaOk") : nonce ? t("captchaCheck") : t("captchaPow")}
        </button>
      </div>
      {!nonce && code && !fail ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {t("captchaPow")}
        </p>
      ) : null}
      {fail ? (
        <p role="alert" className="text-xs text-short">
          {fail}
        </p>
      ) : null}
    </div>
  );
}
