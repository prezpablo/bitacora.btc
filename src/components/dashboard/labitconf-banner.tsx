import { useT } from "@/lib/i18n";

export const LABITCONF_URL = "https://www.labitconf.com/";

/** Featured LABITCONF 26 HODL strip — colours from labitconf.com (#171616 / #ABF760). */
export function LabitconfBanner() {
  const t = useT();
  return (
    <a
      href={LABITCONF_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-lg border-2 border-[#ABF760] bg-[#171616]"
    >
      <img
        src="/labitconf-hodl.jpg"
        alt={t("labitAlt")}
        width={1600}
        height={592}
        className="aspect-[8/3] w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
        decoding="async"
      />
      <span className="absolute top-2 left-2 rounded-full border border-[#ABF760]/70 bg-[#171616]/80 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#ABF760] uppercase sm:top-3 sm:left-3 sm:text-[11px]">
        {t("labitKicker")}
      </span>
      <span className="absolute right-2 bottom-2 inline-flex min-h-8 items-center rounded-full bg-[#ABF760] px-3 py-1 text-[11px] font-black tracking-[0.08em] text-[#171616] uppercase sm:right-3 sm:bottom-3 sm:px-4 sm:text-xs">
        {t("labitCta")}
      </span>
    </a>
  );
}
