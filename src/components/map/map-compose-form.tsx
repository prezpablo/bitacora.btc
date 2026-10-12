import { PrivacyAccept } from "@/components/privacy-accept";
import { Button } from "@/components/ui/button";
import type { WeekHours } from "@/domain/hours";
import type { PayKey } from "@/domain/pays";
import type { SocialKey } from "@/domain/socials";
import { formatStreet, type StreetHit } from "@/infrastructure/address";
import type { AppLang } from "@/lib/locale";
import { useT } from "@/lib/i18n";
import { AddressSearch } from "./address-search";
import { CaptchaBox, type CaptchaTicket } from "./captcha";
import { HoursEditor } from "./hours-editor";
import { LogoPicker } from "./logo-picker";
import { PayPicker } from "./pay-row";
import { SocialPicker } from "./social-row";

export type CommForm = {
  slug: string;
  name: string;
  description: string;
  logo: string;
};

export const EMPTY_COMM_FORM: CommForm = { slug: "", name: "", description: "", logo: "" };

export function MapComposeForm({
  kind,
  lang,
  shopName,
  shopDesc,
  shopNotes,
  shopHours,
  shopPays,
  shopAddr,
  addrHit,
  shopLogo,
  form,
  picked,
  handles,
  captchaOk,
  privacyOk,
  formErr,
  near,
  onShopName,
  onShopDesc,
  onShopNotes,
  onShopHours,
  onShopPays,
  onShopAddr,
  onAddrHit,
  onShopLogo,
  onForm,
  onToggleSocial,
  onHandle,
  onCaptcha,
  onTicket,
  onPrivacy,
  onPickAddress,
  onPublish,
  onCancel,
}: {
  kind: "comercio" | "comunidad";
  lang: AppLang;
  shopName: string;
  shopDesc: string;
  shopNotes: string;
  shopHours: WeekHours;
  shopPays: PayKey[];
  shopAddr: string;
  addrHit: StreetHit | null;
  shopLogo: string;
  form: CommForm;
  picked: SocialKey[];
  handles: Partial<Record<SocialKey, string>>;
  captchaOk: boolean;
  privacyOk: boolean;
  formErr: string;
  near?: { lat: number; lon: number } | null;
  onShopName: (v: string) => void;
  onShopDesc: (v: string) => void;
  onShopNotes: (v: string) => void;
  onShopHours: (v: WeekHours) => void;
  onShopPays: (v: PayKey[]) => void;
  onShopAddr: (v: string) => void;
  onAddrHit: (v: StreetHit | null) => void;
  onShopLogo: (v: string) => void;
  onForm: (fn: (f: CommForm) => CommForm) => void;
  onToggleSocial: (k: SocialKey) => void;
  onHandle: (k: SocialKey, v: string) => void;
  onCaptcha: (ok: boolean) => void;
  onTicket: (t: CaptchaTicket | null) => void;
  onPrivacy: (ok: boolean) => void;
  onPickAddress: (hit: StreetHit) => void;
  onPublish: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  // Comercio y comunidad: pin + nombre + captcha + privacidad. La dirección es opcional.
  const shopReady = Boolean(shopName.trim()) && captchaOk && privacyOk;
  const commReady = Boolean(form.name.trim()) && captchaOk && privacyOk;
  if (kind === "comercio") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-pretty text-muted-foreground">{t("composeHow")}</p>
        <p className="text-xs text-pretty text-muted-foreground">{t("shopKeeper")}</p>
        <p className="text-xs text-muted-foreground">{t("reqHint")}</p>
        <label className="block text-sm">
          {t("fldName")}{" "}
          <span className="text-primary" aria-hidden="true">
            *
          </span>
          <input
            className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
            value={shopName}
            onChange={(e) => onShopName(e.target.value)}
            placeholder={t("phName")}
            aria-required="true"
            required
          />
        </label>
        <label className="block text-sm">
          {t("fldDesc")}
          <textarea
            className="mt-1 min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
            value={shopDesc}
            onChange={(e) => onShopDesc(e.target.value)}
            placeholder={t("phDesc")}
          />
        </label>
        <label className="block text-sm">
          {t("fldNotes")}
          <textarea
            className="mt-1 min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
            value={shopNotes}
            onChange={(e) => onShopNotes(e.target.value)}
            placeholder={t("phNotes")}
          />
        </label>
        <AddressSearch
          value={shopAddr}
          hit={addrHit}
          near={near}
          onChange={(v) => {
            onShopAddr(v);
            if (!addrHit || v.trim() !== formatStreet(addrHit, lang)) onAddrHit(null);
          }}
          onPick={onPickAddress}
        />
        <LogoPicker value={shopLogo} onChange={onShopLogo} />
        <HoursEditor value={shopHours} onChange={onShopHours} />
        <PayPicker value={shopPays} onChange={onShopPays} />
        <SocialPicker picked={picked} handles={handles} onToggle={onToggleSocial} onHandle={onHandle} />
        <PrivacyAccept id="privacy-map-shop" checked={privacyOk} onChange={onPrivacy} />
        <CaptchaBox key="shop" ok={captchaOk} onOk={onCaptcha} onTicket={onTicket} onContinue={onPublish} />
        {formErr ? <p className="text-sm text-short">{formErr}</p> : null}
        <Button className="w-full" onClick={onPublish} disabled={!shopReady} title={shopReady ? undefined : t("reqHint")}>
          {t("proposeShop")}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
          {t("pinCancel")}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-pretty text-muted-foreground">{t("composeHow")}</p>
      <p className="text-xs text-muted-foreground">{t("reqHint")}</p>
      <label className="block text-sm">
        {t("fldName")}{" "}
        <span className="text-primary" aria-hidden="true">
          *
        </span>
        <input
          className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
          placeholder={t("phCommName")}
          value={form.name}
          onChange={(e) => onForm((f) => ({ ...f, name: e.target.value }))}
          aria-required="true"
          required
        />
      </label>
      <label className="block text-sm">
        {t("phSlug")}
        <input
          className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
          placeholder={t("phSlug")}
          value={form.slug}
          onChange={(e) => onForm((f) => ({ ...f, slug: e.target.value }))}
        />
      </label>
      <label className="block text-sm">
        {t("fldDesc")}
        <textarea
          className="mt-1 min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
          placeholder={t("phCommDesc")}
          value={form.description}
          onChange={(e) => onForm((f) => ({ ...f, description: e.target.value }))}
        />
      </label>
      <LogoPicker value={form.logo} onChange={(logo) => onForm((f) => ({ ...f, logo }))} />
      <SocialPicker picked={picked} handles={handles} onToggle={onToggleSocial} onHandle={onHandle} />
      <PrivacyAccept id="privacy-map-comm" checked={privacyOk} onChange={onPrivacy} />
      <CaptchaBox key="comm" ok={captchaOk} onOk={onCaptcha} onTicket={onTicket} onContinue={onPublish} />
      {formErr ? <p className="text-sm text-short">{formErr}</p> : null}
      <Button className="w-full" onClick={onPublish} disabled={!commReady} title={commReady ? undefined : t("reqHint")}>
        {t("publishComm")}
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
        {t("pinCancel")}
      </Button>
    </div>
  );
}
