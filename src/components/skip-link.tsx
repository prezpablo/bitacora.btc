import { useT } from "@/lib/i18n";

export function SkipLink() {
  const t = useT();
  return (
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:absolute focus:z-[90] focus:m-3 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-white"
    >
      {t("skipToContent")}
    </a>
  );
}
