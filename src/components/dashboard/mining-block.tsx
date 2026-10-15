import { useEffect, useRef, useState } from "react";
import { mineLightTone } from "@/domain/mine-light";
import { useT, type CopyKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STEPS = ["mineStep1", "mineStep2", "mineStep3", "mineStep4"] as const;
const BODIES = ["mineBody1", "mineBody2", "mineBody3", "mineBody4"] as const;
const THEMES = [
  ["how", "mineHow"],
  ["power", "minePower"],
  ["care", "mineCare"],
] as const;
const FLAGS = ["mineFlag1", "mineFlag2", "mineFlag3", "mineFlag4"] as const;
const TONE: Record<ReturnType<typeof mineLightTone>, CopyKey> = {
  room: "mineRoom",
  thin: "mineThin",
  eats: "mineEats",
};

export function MiningBlock() {
  const t = useT();
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState<(typeof THEMES)[number][0]>("how");
  const [cents, setCents] = useState(12);
  const [flags, setFlags] = useState([false, false, false, false]);
  const warned = flags.some(Boolean);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme !== "how") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setStep((n) => (n + 1) % STEPS.length), 5000);
    return () => window.clearInterval(id);
  }, [theme, step]);

  const show = () => {
    const panel = panelRef.current;
    if (!panel) return;
    const box = panel.getBoundingClientRect();
    const scroller = panel.closest(".scroll-free");
    const limit = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
    if (box.bottom > limit - 8 || box.top < 0) {
      panel.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{t("mineTitle")}</h2>
        <p className="mt-1 max-w-2xl text-base text-pretty text-muted-foreground">{t("mineLead")}</p>
      </div>
      <div role="group" aria-label={t("mineStepsAria")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((key, i) => (
          <button
            key={key}
            type="button"
            aria-pressed={step === i}
            onClick={() => {
              setStep(i);
              setTheme("how");
              window.setTimeout(show, 0);
            }}
            className="mine-step rounded-md bg-card p-3 text-left"
          >
            <span className="block text-xs text-muted-foreground">{i + 1}</span>
            <span className="mt-1 block text-[15px] font-medium text-foreground">{t(key)}</span>
            <span className={cn("mine-dots mt-2.5 flex gap-[5px]", step === i && "is-live")} aria-hidden="true">
              {Array.from({ length: 7 }, (_, n) => (
                <i key={n} />
              ))}
            </span>
          </button>
        ))}
      </div>
      <div role="group" aria-label={t("mineThemesAria")} className="chip-row">
        {THEMES.map(([id, key]) => (
          <button
            key={id}
            type="button"
            aria-pressed={theme === id}
            onClick={() => {
              setTheme(id);
              window.setTimeout(show, 0);
            }}
            className={cn("chip", theme === id ? "chip-on" : "chip-idle")}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <div ref={panelRef} className="rounded-md bg-card p-3.5 shadow-[var(--shadow-border)] sm:p-4">
        {theme === "how" ? <p className="text-base text-pretty text-foreground">{t(BODIES[step] ?? "mineBody1")}</p> : null}
        {theme === "power" ? (
          <div className="space-y-3">
            <p className="text-base font-medium text-foreground">{t("mineCents", { n: cents })}</p>
            <input
              type="range"
              min={3}
              max={25}
              step={1}
              value={cents}
              aria-label={t("mineRangeAria")}
              aria-valuetext={t("mineCents", { n: cents })}
              onChange={(e) => setCents(Number(e.target.value))}
              className="w-full accent-[#f7931a]"
            />
            <p className="text-base text-pretty text-foreground">{t(TONE[mineLightTone(cents)], { n: cents })}</p>
            <p className="text-sm text-pretty text-muted-foreground">{t("mineNote")}</p>
          </div>
        ) : null}
        {theme === "care" ? (
          <div>
            {FLAGS.map((key, i) => (
              <button
                key={key}
                type="button"
                aria-pressed={flags[i]}
                onClick={() => setFlags((prev) => prev.map((on, n) => (n === i ? !on : on)))}
                className="flex w-full items-start gap-2.5 border-t border-border py-2.5 text-left text-sm text-foreground first:border-t-0"
              >
                <span
                  aria-hidden="true"
                  className={cn("mt-0.5 size-3.5 shrink-0 rounded-sm shadow-[0_0_0_1px_#c8c8c8]", flags[i] && "bg-primary shadow-none")}
                />
                {t(key)}
              </button>
            ))}
            {warned ? <p className="mt-2 rounded-md bg-elevated p-3 text-sm text-pretty text-foreground">{t("mineWarn")}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
