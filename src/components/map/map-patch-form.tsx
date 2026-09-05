import { useState } from "react";
import { submitListingPatch, verifyListingPatch, cancelListingPatch } from "@/infrastructure/server-fns";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CaptchaBox, type CaptchaTicket } from "./captcha";
import { PrivacyAccept } from "@/components/privacy-accept";
import { VerifyIgHow } from "./verify-ig-how";

export function ListingPatchForm({
  listingId,
  name,
  description,
  address,
  notes,
  logo,
  lat,
  lon,
  isCommunity,
  onApplied,
  onClose,
}: {
  listingId: string;
  name: string;
  description?: string;
  address?: string;
  notes?: string;
  logo?: string;
  lat: number;
  lon: number;
  isCommunity?: boolean;
  onApplied?: () => void;
  onClose?: () => void;
}) {
  const t = useT();
  const disputeHref = `/?topic=dispute&listing=${encodeURIComponent(listingId)}#contacto`;
  const [nextName, setNextName] = useState(name);
  const [nextDesc, setNextDesc] = useState(description || "");
  const [nextAddr, setNextAddr] = useState(address || "");
  const [nextNotes, setNextNotes] = useState(notes || "");
  const [nextLogo, setNextLogo] = useState(logo || "");
  const [proof, setProof] = useState("");
  const [captchaOk, setCaptchaOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [ticket, setTicket] = useState<CaptchaTicket | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState<{ id: string; token: string } | null>(null);

  function fail(code?: string) {
    if (code === "captcha") setErr(t("captchaNeed"));
    else if (code === "rate") setErr(t("patchRate"));
    else if (code === "nochange") setErr(t("patchNochange"));
    else if (code === "links") setErr(t("verifyNeedLink"));
    else if (code === "need") setErr(t("patchNeed"));
    else setErr(t("patchFail"));
  }

  if (pending) {
    return (
      <div className="space-y-2 rounded-md bg-elevated px-3 py-2 text-sm">
        <p className="text-muted-foreground">{t("patchPending")}</p>
        <p>
          <code className="rounded bg-primary px-1.5 py-0.5 font-mono text-sm font-bold text-white">{pending.token}</code>
        </p>
        <VerifyIgHow />
        {err ? <p className="text-primary">{err}</p> : null}
        <Button
          type="button"
          className="w-full"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setErr("");
            void verifyListingPatch({ data: { id: pending.id, token: pending.token } })
              .then((res) => {
                if (res.ok) {
                  setPending(null);
                  onApplied?.();
                  onClose?.();
                } else setErr(res.error === "proof" ? t("pinProofFail") : t("patchFail"));
              })
              .finally(() => setBusy(false));
          }}
        >
          {t("pinCheck")}
        </Button>
        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground"
          onClick={() => {
            void cancelListingPatch({ data: { id: pending.id, token: pending.token } });
            setPending(null);
            onClose?.();
          }}
        >
          {t("pinCancel")}
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!captchaOk) {
          setErr(t("captchaNeed"));
          return;
        }
        if (!privacyOk) {
          setErr(t("privacyAcceptNeed"));
          return;
        }
        setBusy(true);
        setErr("");
        void submitListingPatch({
          data: {
            listingId,
            name: nextName,
            description: nextDesc,
            address: isCommunity ? undefined : nextAddr,
            notes: nextNotes,
            logo: nextLogo,
            proof,
            lat,
            lon,
            community: Boolean(isCommunity),
            captchaId: ticket?.id,
            captcha: ticket?.answer,
            captchaNonce: ticket?.nonce,
          },
        })
          .then((res) => {
            if (res.ok && res.id && res.token) setPending({ id: res.id, token: res.token });
            else fail(res.error);
          })
          .finally(() => setBusy(false));
      }}
    >
      <p className="text-xs text-pretty text-muted-foreground">{t("patchLead")}</p>
      <label className="block text-sm">
        {t("fldName")}
        <input className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]" value={nextName} onChange={(e) => setNextName(e.target.value)} />
      </label>
      <label className="block text-sm">
        {t("fldDesc")}
        <textarea className="mt-1 min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]" value={nextDesc} onChange={(e) => setNextDesc(e.target.value)} maxLength={500} />
      </label>
      {!isCommunity ? (
        <label className="block text-sm">
          {t("fldAddr")}
          <input className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]" value={nextAddr} onChange={(e) => setNextAddr(e.target.value)} />
        </label>
      ) : null}
      <label className="block text-sm">
        {t("patchProof")}
        <input
          className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          placeholder={t("patchPhProof")}
          required
        />
      </label>
      <CaptchaBox ok={captchaOk} onOk={setCaptchaOk} onTicket={setTicket} />
      <PrivacyAccept id={`privacy-patch-${listingId}`} checked={privacyOk} onChange={setPrivacyOk} />
      {err ? <p className="text-sm text-primary">{err}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {t("patchSubmit")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onClose?.()}>
          {t("pinCancel")}
        </Button>
      </div>
      <a href={disputeHref} className="block text-center text-xs text-primary no-underline hover:underline">
        {t("patchDispute")}
      </a>
    </form>
  );
}
