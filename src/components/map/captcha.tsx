import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function rollCode() {
  let s = "";
  for (let i = 0; i < 5; i++) s += ABC[Math.floor(Math.random() * ABC.length)]!;
  return s;
}

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
}: {
  ok: boolean;
  onOk: (v: boolean) => void;
}) {
  const t = useT();
  const [code, setCode] = useState(rollCode);
  const [typed, setTyped] = useState("");
  const [hp, setHp] = useState("");
  const [born, setBorn] = useState(() => Date.now());
  const [fail, setFail] = useState("");
  const lines = useMemo(() => noise(code.split("").reduce((a, c) => a + c.charCodeAt(0), 0)), [code]);

  useEffect(() => {
    onOk(false);
    // only when the challenge itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function refresh() {
    setCode(rollCode());
    setTyped("");
    setFail("");
    setBorn(Date.now());
    onOk(false);
  }

  function check() {
    if (hp.trim()) {
      setFail(t("captchaFail"));
      return;
    }
    if (Date.now() - born < 900) {
      setFail(t("captchaSlow"));
      return;
    }
    if (typed.trim().toUpperCase() === code) {
      setFail("");
      onOk(true);
    } else {
      setFail(t("captchaFail"));
      refresh();
    }
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
          {code.split("").map((ch, i) => (
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
          onClick={refresh}
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
            setTyped(e.target.value);
            if (ok) onOk(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              check();
            }
          }}
          placeholder={t("captchaHint")}
          aria-label={t("captchaTitle")}
          autoComplete="off"
          spellCheck={false}
          maxLength={8}
          aria-invalid={fail ? true : undefined}
        />
        <button
          type="button"
          className={cn(
            "h-10 shrink-0 rounded-md px-3 text-xs font-semibold",
            ok ? "bg-long text-white" : "bg-primary text-white",
          )}
          onClick={check}
        >
          {ok ? t("captchaOk") : t("captchaCheck")}
        </button>
      </div>
      {fail ? <p className="text-xs text-short">{fail}</p> : null}
    </div>
  );
}
