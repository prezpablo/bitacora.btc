import { useState } from "react";
import { useT } from "@/lib/i18n";
import { imgSrc, logoUrl } from "@/domain";

export function LogoPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const t = useT();
  const [err, setErr] = useState("");
  const preview = imgSrc(value);

  function apply(raw: string) {
    if (!raw.trim()) {
      setErr("");
      onChange("");
      return;
    }
    const url = logoUrl(raw);
    if (!url) {
      setErr(t("logoUrlBad"));
      return;
    }
    setErr("");
    onChange(url);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("fldLogo")}</p>
      <div className="flex items-center gap-3 rounded-md bg-elevated px-3 py-2 shadow-[var(--shadow-border)]">
        {preview ? (
          <img src={preview} alt="" className="size-12 rounded-full object-cover" />
        ) : (
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
            ₿
          </span>
        )}
        <label className="min-w-0 flex-1 text-sm">
          <span className="block font-medium">{t("logoUrl")}</span>
          <input
            className="mt-1 h-9 w-full rounded-md bg-card px-2 text-sm shadow-[var(--shadow-border)]"
            value={value}
            onChange={(e) => apply(e.target.value)}
            placeholder="https://"
            inputMode="url"
            autoComplete="url"
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
      <p className="text-xs text-muted-foreground">{t("logoRights")}</p>
      {err ? (
        <div className="relative pt-1">
          <span className="absolute top-0 left-6 size-2 rotate-45 bg-primary" aria-hidden />
          <p role="alert" className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-white">{err}</p>
        </div>
      ) : null}
    </div>
  );
}
