import { useT } from "@/lib/i18n";

export function VerifyIgHow() {
  const t = useT();
  return (
    <div className="space-y-1.5 rounded-md bg-elevated px-3 py-2 text-sm">
      <p className="font-medium text-foreground">{t("verifyIgTitle")}</p>
      <ol className="list-decimal space-y-1 pl-4 text-pretty text-muted-foreground">
        <li>{t("verifyIg1")}</li>
        <li>{t("verifyIg2")}</li>
        <li>{t("verifyIg3")}</li>
      </ol>
      <p className="text-pretty text-muted-foreground">{t("verifyIgAlt")}</p>
    </div>
  );
}
