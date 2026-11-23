import { useAppLang, useT } from "@/lib/i18n";

/** El Zonte, partido. Solo cuando ese evento es el vigente. */
export function BeachSplit() {
  const t = useT();
  const site = "https://www.bitcoinbeach.com/";
  const floats = [
    { top: "6%", left: "10%", delay: "0s", size: "13px", dur: "6.4s" },
    { top: "22%", left: "58%", delay: "1.1s", size: "18px", dur: "7.8s" },
    { top: "40%", left: "18%", delay: "2.4s", size: "11px", dur: "8.6s" },
    { top: "58%", left: "64%", delay: "0.6s", size: "15px", dur: "7.1s" },
    { top: "74%", left: "28%", delay: "3.2s", size: "12px", dur: "9s" },
    { top: "88%", left: "70%", delay: "1.8s", size: "16px", dur: "6.8s" },
  ];
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-lg border-2 border-[#FE6A00] bg-[#101820]">
      <a href={site} target="_blank" rel="noopener noreferrer" className="flex items-center bg-[#1a0c08]" aria-label={t("beachAlt")}>
        <img
          src="/eventos/beach-summit.jpg"
          alt={t("beachCircular")}
          width={931}
          height={518}
          className="h-auto w-full"
          decoding="async"
        />
      </a>
      <a
        href={site}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex w-24 items-center justify-center overflow-hidden border-x border-border bg-white sm:w-28"
      >
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {floats.map((f) => (
            <span
              key={f.delay + f.left}
              className="beach-btc"
              style={{
                top: f.top,
                left: f.left,
                fontSize: f.size,
                animationDelay: f.delay,
                animationDuration: f.dur,
              }}
            >
              ₿
            </span>
          ))}
        </span>
        <span className="beach-more relative z-10 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-white sm:h-9 sm:px-3.5 sm:text-sm">
          {t("beachTickets")}
        </span>
      </a>
      <a href={site} target="_blank" rel="noopener noreferrer" className="flex items-center bg-[#f6ead2]">
        <img
          src="/eventos/beach-festival.jpg"
          alt={t("beachFestival")}
          width={931}
          height={430}
          className="h-auto w-full"
          decoding="async"
        />
      </a>
    </div>
  );
}

/** Sovereign Conference, Asunción. Solo cuando ese evento es el vigente. */
export function SovereignBanner() {
  const t = useT();
  const lang = useAppLang();
  const site = lang === "en" ? "https://sovereign-conference.com/" : "https://sovereign-conference.com/es/";
  const program = `${site}#program`;
  const tickets = "https://www.satlantis.io/embed/events/1002890/tickets";
  return (
    <section className="overflow-hidden rounded-lg border border-[#2c2c2c] bg-[#0b0b0b]" aria-label={t("sovAlt")}>
      <div className="h-1 bg-[#f7931a]" />
      <div className="flex items-end gap-3 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.16em] text-[#f7931a] uppercase sm:text-xs">{t("sovMeta")}</p>
          <a href={site} target="_blank" rel="noopener noreferrer" className="mt-2 block no-underline">
            <span className="sov-word block text-[#f4efe4]">Sovereign</span>
            <span className="sov-word block text-[#f7931a]">Conference</span>
          </a>
          <p className="mt-3 text-xs text-[#a8a29a] sm:text-sm">{t("sovThemes")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={tickets}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center bg-[#f7931a] px-4 text-sm font-semibold text-[#0b0b0b] no-underline hover:bg-[#ffa640]"
            >
              {t("sovCta")}
            </a>
            <a
              href={program}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center border border-[#f4efe4] px-4 text-sm font-semibold text-[#f4efe4] no-underline hover:bg-[#141414]"
            >
              {t("labitAgenda")}
            </a>
          </div>
        </div>
        <svg viewBox="0 0 64 80" className="mb-1 hidden h-16 w-14 shrink-0 sm:block" aria-hidden="true">
          <rect x="8" y="6" width="40" height="62" fill="none" stroke="#f7931a" strokeWidth="1.6" />
          <rect x="14" y="14" width="28" height="8" fill="none" stroke="#f7931a" strokeWidth="1.4" />
          <rect x="14" y="28" width="28" height="8" fill="none" stroke="#f7931a" strokeWidth="1.4" />
          <rect x="14" y="42" width="28" height="8" fill="none" stroke="#f7931a" strokeWidth="1.4" />
          <circle cx="36" cy="18" r="1.3" fill="#f7931a" />
          <circle cx="36" cy="32" r="1.3" fill="#f7931a" />
          <circle cx="36" cy="46" r="1.3" fill="#f7931a" />
          <path d="M48 16h8M52 12v8M48 34h8M48 54h8" fill="none" stroke="#f7931a" strokeWidth="1.4" />
        </svg>
      </div>
    </section>
  );
}
