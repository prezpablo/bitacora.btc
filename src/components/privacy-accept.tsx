import { useT } from "@/lib/i18n";

export function PrivacyAccept({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
}) {
  const t = useT();
  return (
    <div className="flex items-start gap-2 text-sm text-foreground">
      <input
        id={id}
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-primary"
        checked={checked}
        aria-required="true"
        required
        onChange={(e) => onChange(e.target.checked)}
      />
      <p className="text-pretty leading-snug">
        <label htmlFor={id}>{t("privacyAccept")} </label>
        <a
          href="/legal#privacidad"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2"
        >
          {t("legalPrivacy")}
        </a>
        .
      </p>
    </div>
  );
}
