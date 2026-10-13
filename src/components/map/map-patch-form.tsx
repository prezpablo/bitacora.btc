import { useRef, useState } from "react";
import { submitListingPatch, verifyListingPatch, cancelListingPatch } from "@/infrastructure/server-fns";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CaptchaBox, type CaptchaTicket } from "./captcha";
import { PrivacyAccept } from "@/components/privacy-accept";
import { CargaProofStep } from "./carga-proof-step";
import { HoursEditor } from "./hours-editor";
import { LogoPicker } from "./logo-picker";
import { PayPicker } from "./pay-row";
import { SocialPicker } from "./social-row";
import { daySlots, DAYS, type WeekHours } from "@/domain/hours";
import { hoursFromCsv, hoursToCsv, paysToCsv, socialsToCsv } from "@/domain/map-csv";
import type { PayKey } from "@/domain/pays";
import { linksFromPicked, type SocialKey, type SocialLink } from "@/domain/socials";

function openHoursCsv(h: WeekHours) {
  return DAYS.some((d) => daySlots(h[d.key]).length) ? hoursToCsv(h) : "";
}

export function ListingPatchForm({
  listingId,
  name,
  description,
  address,
  notes,
  logo,
  hours,
  pays,
  links,
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
  hours?: WeekHours;
  pays?: PayKey[];
  links?: SocialLink[];
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
  const [nextHours, setNextHours] = useState<WeekHours>(hours || hoursFromCsv(""));
  const [nextPays, setNextPays] = useState<PayKey[]>(pays || []);
  const [picked, setPicked] = useState<SocialKey[]>(() => (links || []).map((l) => l.key).filter((k): k is SocialKey => Boolean(k)));
  const [handles, setHandles] = useState<Partial<Record<SocialKey, string>>>(() => {
    const h: Partial<Record<SocialKey, string>> = {};
    for (const l of links || []) if (l.key) h[l.key] = l.url;
    return h;
  });
  const [captchaOk, setCaptchaOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const ticketRef = useRef<CaptchaTicket | null>(null);
  function keepTicket(next: CaptchaTicket | null) {
    ticketRef.current = next;
  }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState<{ id: string; token: string } | null>(null);

  function fail(code?: string) {
    if (code === "captcha") {
      setErr(t("captchaSlow"));
      setCaptchaOk(false);
    } else if (code === "rate") setErr(t("patchRate"));
    else if (code === "nochange") setErr(t("patchNochange"));
    else if (code === "links" || code === "need") setErr(t("verifyNeedLink"));
    else if (code === "instagram") setErr(t("pinNoIg"));
    else if (code === "proof") setErr(t("pinProofFail"));
    else setErr(t("patchFail"));
  }

  function send() {
    if (!nextName.trim()) {
      setErr(t("pinNeed"));
      return;
    }
    if (!privacyOk) {
      setErr(t("privacyAcceptNeed"));
      return;
    }
    const cap = ticketRef.current;
    if (!cap) {
      setErr(t("captchaNeed"));
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
        notes: isCommunity ? undefined : nextNotes,
        logo: nextLogo,
        hours: isCommunity ? undefined : openHoursCsv(nextHours),
        pays: isCommunity ? undefined : paysToCsv(nextPays),
        socials: isCommunity ? undefined : socialsToCsv(linksFromPicked(picked, handles)),
        lat,
        lon,
        community: Boolean(isCommunity),
        captchaId: cap.id,
        captcha: cap.answer,
        captchaNonce: cap.nonce,
        consent: true,
      },
    })
      .then((res) => {
        if (res.ok && res.id && res.token) setPending({ id: res.id, token: res.token });
        else fail(res.error);
      })
      .finally(() => setBusy(false));
  }

  if (pending) {
    return (
      <div className="space-y-2 rounded-md bg-elevated px-3 py-2 text-sm">
        <p className="text-muted-foreground">{t("patchPending")}</p>
        <CargaProofStep
          token={pending.token}
          busy={busy}
          err={err}
          onCheck={(url) => {
            setBusy(true);
            setErr("");
            void verifyListingPatch({ data: { id: pending.id, token: pending.token, proof: url } })
              .then((res) => {
                if (res.ok) {
                  setPending(null);
                  onApplied?.();
                  onClose?.();
                } else fail(res.error);
              })
              .finally(() => setBusy(false));
          }}
          onCancel={() => {
            void cancelListingPatch({ data: { id: pending.id, token: pending.token } });
            setPending(null);
            onClose?.();
          }}
        />
      </div>
    );
  }

  return (
    <form
      id={`patch-form-${listingId}`}
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <p className="text-xs text-pretty text-muted-foreground">{t("patchLead")}</p>
      {!isCommunity ? <p className="text-xs text-pretty text-muted-foreground">{t("shopKeeper")}</p> : null}
      <p className="text-xs text-muted-foreground">{t("reqHint")}</p>
      <label className="block text-sm">
        {t("fldName")}{" "}
        <span className="text-primary" aria-hidden="true">
          *
        </span>
        <input className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]" value={nextName} onChange={(e) => setNextName(e.target.value)} aria-required="true" required />
      </label>
      <label className="block text-sm">
        {t("fldDesc")}
        <textarea className="mt-1 min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]" value={nextDesc} onChange={(e) => setNextDesc(e.target.value)} maxLength={500} />
      </label>
      {!isCommunity ? (
        <>
          <label className="block text-sm">
            {t("fldAddr")}
            <input className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]" value={nextAddr} onChange={(e) => setNextAddr(e.target.value)} />
          </label>
          <label className="block text-sm">
            {t("fldNotes")}
            <textarea className="mt-1 min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]" value={nextNotes} onChange={(e) => setNextNotes(e.target.value)} maxLength={280} />
          </label>
          <LogoPicker value={nextLogo} onChange={setNextLogo} />
          <HoursEditor value={nextHours} onChange={setNextHours} />
          <PayPicker value={nextPays} onChange={setNextPays} />
          <SocialPicker
            picked={picked}
            handles={handles}
            onToggle={(k) => setPicked((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]))}
            onHandle={(k, v) => setHandles((h) => ({ ...h, [k]: v }))}
          />
        </>
      ) : (
        <LogoPicker value={nextLogo} onChange={setNextLogo} />
      )}
      <PrivacyAccept id={`privacy-patch-${listingId}`} variant="publish" keep="listing" checked={privacyOk} onChange={setPrivacyOk} />
      <CaptchaBox
        ok={captchaOk}
        onOk={setCaptchaOk}
        onTicket={keepTicket}
      />
      {err ? <p className="text-sm text-primary">{err}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" size="sm" disabled={busy || !nextName.trim() || !captchaOk || !privacyOk} title={nextName.trim() && captchaOk && privacyOk ? undefined : t("reqHint")}>
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
