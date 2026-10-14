import { LEGAL, LEGAL_CITY, legalFilled } from "@/domain/legal-config";
import { useAppLang, useT } from "@/lib/i18n";
import { legalHref } from "@/lib/locale";
import { useRouterState } from "@tanstack/react-router";

export function PrivacyAccept({
  checked,
  onChange,
  id,
  variant = "publish",
  keep = "listing",
  invalid = false,
  describedBy,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
  /** Contacto habla de FormSubmit. El resto publica en GitHub. */
  variant?: "contact" | "publish";
  /** Ficha = mientras exista. Anuncio = 7 días. Experiencia = texto propio, no el del directorio. */
  keep?: "listing" | "pin" | "xp";
  invalid?: boolean;
  describedBy?: string;
}) {
  const t = useT();
  const lang = useAppLang();
  const search = useRouterState({ select: (s) => s.location.searchStr ?? s.location.search });
  const keepText = keep === "pin" ? t("consentKeepPin") : keep === "xp" ? t("consentKeepXp") : t("consentKeepListing");
  const who = [
    variant === "contact" && legalFilled(LEGAL.controllerName)
      ? t(legalFilled(LEGAL.address) ? "legalWho" : "legalWhoPending", {
          name: LEGAL.controllerName,
          address: LEGAL.address,
          city: LEGAL_CITY[lang],
          email: LEGAL.privacyEmail,
        })
      : legalFilled(LEGAL.controllerName)
        ? t("consentWhoName", { name: LEGAL.controllerName })
        : "",
    variant !== "contact" && legalFilled(LEGAL.address) ? t("consentWhoAddress", { address: LEGAL.address }) : "",
    variant === "publish" && legalFilled(LEGAL.contributionLicense) ? t("consentLicense", { license: LEGAL.contributionLicense }) : "",
  ]
    .filter(Boolean)
    .join(" ");
  const info = variant === "contact" ? t("consentContactInfo") : keep === "xp" ? t("consentXpInfo", { keep: keepText }) : t("consentPublishInfo", { keep: keepText });
  return (
    <div className="flex items-start gap-2 text-sm text-foreground">
      <input
        id={id}
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-primary"
        checked={checked}
        aria-required="true"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy || undefined}
        required
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="min-w-0">
        <p className="text-pretty leading-snug">
          <label htmlFor={id}>{variant === "contact" ? t("consentContact") : keep === "xp" ? t("consentPublishXp") : t("consentPublish")} </label>
          {variant === "publish" ? (
            <>
              <a href={legalHref("terminos", String(search || ""))} className="font-medium text-foreground underline underline-offset-2">
                {t("legalTerms")}
              </a>{" "}
              {t("consentAnd")}{" "}
            </>
          ) : null}
          <a href={legalHref("privacidad", String(search || ""))} className="font-medium text-foreground underline underline-offset-2">
            {t("legalPrivacy")}
          </a>
          .
        </p>
        <p className="mt-1 text-xs leading-snug text-pretty text-muted-foreground">
          {info} {who ? `${who} ` : null}
          <a className="underline underline-offset-2" href={`mailto:${LEGAL.privacyEmail}`}>
            {LEGAL.privacyEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
