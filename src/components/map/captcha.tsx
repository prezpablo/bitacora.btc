import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { issueCaptcha } from "@/infrastructure/server-fns";
import { minePow } from "@/lib/pow";
import { useT } from "@/lib/i18n";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="space-y-2 rounded-md bg-elevated p-3 shadow-[var(--shadow-border)]">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("captchaTitle")}</p>
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
          onClick={() => void load()}
          aria-label={t("captchaRefresh")}
          title={t("captchaRefresh")}
        >
          <RefreshCw className="size-4" />
        </button>
      </div>
      <label className="hidden">
        {t("hpWeb")}
        <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
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
          aria-label={t("captchaTitle")}
          autoComplete="off"
          spellCheck={false}
          maxLength={8}
          disabled={loading || !code || !nonce}
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
          {ok ? t("captchaOk") : t("captchaCheck")}
        </button>
      </div>
      {fail ? <p className="text-xs text-short">{fail}</p> : null}
    </div>
  );
}
