import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const BITCOIN_MARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#F7931A"/><path fill="#fff" d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.113-.92-.22-1.385-.326l.695-2.783-1.727-.43-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.803 1.006l-.804 3.225c.048.012.11.028.179.047l-.038-.01.01.008-.81 3.247c-.063.158-.224.396-.736.305.016.023-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.214 1.23.322l-.723 2.901 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.722-2.895c2.964.562 5.194.334 6.126-2.346.751-2.146-.039-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.37 4.715c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"/></svg>';

export function BitcoinMark({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        fill="#fff"
        d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.113-.92-.22-1.385-.326l.695-2.783-1.727-.43-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.803 1.006l-.804 3.225c.048.012.11.028.179.047l-.038-.01.01.008-.81 3.247c-.063.158-.224.396-.736.305.016.023-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.214 1.23.322l-.723 2.901 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.722-2.895c2.964.562 5.194.334 6.126-2.346.751-2.146-.039-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.37 4.715c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
      />
    </svg>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const t = useT();
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "font-display flex items-baseline leading-none font-medium tracking-tight text-foreground",
          compact ? "text-xl sm:text-3xl" : "text-[2rem] sm:text-5xl",
        )}
      >
        <span className="flex items-baseline">
          <span className="relative mr-[0.06em] inline-block w-[0.95em] shrink-0">
            <span className="invisible">B</span>
            <BitcoinMark className="pointer-events-none absolute left-1/2 top-[0.16em] size-[1.12em] -translate-x-1/2" />
          </span>
          itácora<span className="text-[#F7931A]">btc</span>.org
        </span>
      </p>
      {compact ? null : (
        <p className="mt-2 text-base text-pretty text-muted-foreground sm:text-xl">
          {t("tagline").split("Bircoiner")[0]}
          <span className="font-medium text-foreground">Bircoiner</span>
          {t("tagline").includes("Bircoiner") ? t("tagline").split("Bircoiner")[1] : ""}
        </p>
      )}
    </div>
  );
}
