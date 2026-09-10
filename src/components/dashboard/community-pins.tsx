import { useEffect, useMemo, useRef, useState } from "react";
import { Pin } from "lucide-react";
import { CaptchaBox, type CaptchaTicket } from "@/components/map/captcha";
import { PrivacyAccept } from "@/components/privacy-accept";
import { SocialRow } from "@/components/map/social-row";
import { getCommunityPins, submitCommunityPin, verifyCommunityPin } from "@/infrastructure/server-fns";
import { pinOnBoard, pinPending, pinTimeLeft, formatPinLeft, pinWeekPose, type CommunityPin } from "@/domain/community-pins";
import { useQuery } from "@tanstack/react-query";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { VerifyIgHow } from "@/components/map/verify-ig-how";
import { CargaPendingView, holdCargaSpinner } from "@/components/map/carga-proof-step";

const PENDING_KEY = "bitacora-pin-pending";

type Pending = { id: string; token: string; name: string; proof: string; created: number };

function readPending(): Pending | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY) || localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending;
    if (!p.id || !p.token) return null;
    return { ...p, created: Number(p.created) || Date.now() };
  } catch {
    return null;
  }
}

function writePending(p: Pending | null) {
  if (typeof window === "undefined") return;
  try {
    if (!p) {
      sessionStorage.removeItem(PENDING_KEY);
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    const raw = JSON.stringify(p);
    sessionStorage.setItem(PENDING_KEY, raw);
    localStorage.setItem(PENDING_KEY, raw);
  } catch {
    /* quota */
  }
}

export function CommunityPinsBoard() {
  const t = useT();
  const q = useQuery({
    queryKey: ["community-pins"],
    queryFn: () => getCommunityPins(),
    staleTime: 60_000,
  });
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [proof, setProof] = useState("");
  const [links, setLinks] = useState("");
  const [captchaOk, setCaptchaOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [ticket, setTicket] = useState<CaptchaTicket | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [generating, setGenerating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const cancelled = useRef(false);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setPending(readPending());
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pending?.token) return;
    let stop = false;
    void navigator.clipboard.writeText(pending.token).then(() => {
      if (stop) return;
      setCopied(true);
      window.setTimeout(() => {
        if (!stop) setCopied(false);
      }, 4000);
    }).catch(() => {});
    return () => {
      stop = true;
    };
  }, [pending?.token]);

  function keepPending(p: Pending | null) {
    setPending(p);
    writePending(p);
  }

  function abort() {
    cancelled.current = true;
    keepPending(null);
    setName("");
    setBlurb("");
    setProof("");
    setLinks("");
    setCaptchaOk(false);
    setPrivacyOk(false);
    setTicket(null);
    setErr("");
    setBusy(false);
    setGenerating(false);
    setCopied(false);
    setCaptchaKey((n) => n + 1);
    setFormOpen(false);
  }

  const live = useMemo(() => {
    const rows = [...(q.data || [])];
    if (pending && !rows.some((p) => p.id === pending.id)) {
      rows.push({
        id: pending.id,
        name: pending.name || "…",
        blurb: "",
        proof: pending.proof,
        links: [],
        token: pending.token,
        verified: false,
        verifiedAt: 0,
        created: pending.created || now,
      });
    }
    return rows
      .filter((p) => pinOnBoard(p, now))
      .sort((a, b) => pinWeekPose(a.id).order - pinWeekPose(b.id).order);
  }, [q.data, pending, now]);

  async function submit() {
    setErr("");
    if (!captchaOk) {
      setErr(t("captchaNeed"));
      return;
    }
    if (!privacyOk) {
      setErr(t("privacyAcceptNeed"));
      return;
    }
    if (!name.trim()) {
      setErr(t("pinNeed"));
      return;
    }
    setBusy(true);
    setGenerating(true);
    cancelled.current = false;
    const started = Date.now();
    try {
      const extra = links
        .split(/[\s,|]+/)
        .map((u) => u.trim())
        .filter(Boolean)
        .map((u) => (u.match(/^https?:\/\//i) ? u : `https://${u}`));
      const res = await submitCommunityPin({
        data: { name: name.trim(), blurb, links: extra, captchaId: ticket?.id, captcha: ticket?.answer, captchaNonce: ticket?.nonce },
      });
      await holdCargaSpinner(started);
      if (cancelled.current) return;
      if (!res?.ok || !res.token || !res.id) {
        setErr(res?.error === "rate" ? t("pinRate") : res?.error === "captcha" ? t("captchaNeed") : res?.error === "save" ? t("pinSaveFail") : t("pinNeed"));
        return;
      }
      keepPending({ id: res.id, token: res.token, name: name.trim(), proof: "", created: Date.now() });
      await q.refetch();
    } catch {
      setErr(t("pinNeed"));
    } finally {
      setBusy(false);
      setGenerating(false);
    }
  }

  async function check(url?: string) {
    if (!pending) return;
    const proofUrl = (url ?? proof).trim();
    setBusy(true);
    setErr("");
    try {
      const res = await verifyCommunityPin({ data: { id: pending.id, proof: proofUrl || undefined } });
      if (!res.ok) {
        setErr(res.error === "instagram" ? t("pinNoIg") : res.error === "need" ? t("verifyNeedLink") : t("pinProofFail"));
        return;
      }
      keepPending(null);
      setName("");
      setBlurb("");
      setProof("");
      setLinks("");
      setCaptchaOk(false);
      await q.refetch();
    } catch {
      setErr(t("pinProofFail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{t("pinTitle")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-pretty text-muted-foreground">{t("pinLead")}</p>
      </div>

      <div className="relative min-h-40 overflow-hidden rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        {live.length ? (
          <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {live.map((p) => (
              <PinCard
                key={p.id}
                pin={p}
                now={now}
                onCopy={
                  pending?.id === p.id && pending.token
                    ? () => {
                        void navigator.clipboard.writeText(pending.token).then(() => {
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 4000);
                        });
                      }
                    : undefined
                }
              />
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("pinEmpty")}</p>
        )}
      </div>

      <div className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        {pending || generating || formOpen ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">{t("pinFormTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("pinHow")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("reqHint")}</p>
                <div className="mt-2">
                  <VerifyIgHow />
                </div>
              </div>
              <button
                type="button"
                className="h-9 shrink-0 rounded-md bg-elevated px-3 text-sm font-medium text-foreground"
                onClick={abort}
              >
                {t("pinCancel")}
              </button>
            </div>
        {generating || pending ? (
          <div className="mt-4">
            <CargaPendingView
              generating={generating}
              token={pending?.token}
              name={pending?.name}
              busy={busy}
              err={err}
              onCheck={(url) => void check(url)}
              onCancel={abort}
            />
          </div>
        ) : (
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label className="block text-sm sm:col-span-1">
              <span className="text-muted-foreground">
                {t("pinName")}{" "}
                <span className="text-primary" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                aria-required="true"
                required
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted-foreground">{t("pinBlurb")}</span>
              <textarea
                className="mt-1 min-h-16 w-full rounded-md border border-border bg-background px-2 py-1"
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
                maxLength={220}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted-foreground">{t("pinLinks")}</span>
              <input
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                placeholder="https://x.com/…  https://t.me/…"
              />
            </label>
            <div className="sm:col-span-2">
              <CaptchaBox key={`pin-${captchaKey}`} ok={captchaOk} onOk={setCaptchaOk} onTicket={setTicket} />
            </div>
            <div className="sm:col-span-2">
              <PrivacyAccept id="privacy-pin" checked={privacyOk} onChange={setPrivacyOk} />
            </div>
            {err ? <p className="text-sm text-primary sm:col-span-2">{err}</p> : null}
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="submit"
                className="h-9 min-w-40 flex-1 rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-50"
                disabled={busy || !privacyOk || !captchaOk || !name.trim()}
                title={name.trim() && captchaOk && privacyOk ? undefined : t("reqHint")}
              >
                {t("pinSubmit")}
              </button>
              <button
                type="button"
                className="h-9 rounded-md bg-elevated px-3 text-sm font-medium text-foreground"
                onClick={abort}
              >
                {t("pinCancel")}
              </button>
            </div>
          </form>
        )}
          </>
        ) : (
          <button
            type="button"
            className="h-10 w-full rounded-md bg-primary px-3 text-sm font-medium text-white"
            onClick={() => setFormOpen(true)}
          >
            {t("pinNewAd")}
          </button>
        )}
      </div>
    </div>
  );
}

function PinCard({ pin, now, onCopy }: { pin: CommunityPin; now: number; onCopy?: () => void }) {
  const t = useT();
  const pose = pinWeekPose(pin.id);
  const left = formatPinLeft(pinTimeLeft(pin, now));
  const waiting = pinPending(pin, now);
  const href = pin.proof;
  return (
    <li
      className="w-[min(100%,16.5rem)] rounded-md border border-border bg-background p-3 shadow-[var(--shadow-border)]"
      style={{ transform: `rotate(${pose.rot}deg)` }}
    >
      <p className="flex items-center gap-1.5 font-medium text-foreground">
        <Pin className="size-4 shrink-0 text-primary" aria-hidden />
        {waiting && onCopy ? (
          <button type="button" className="truncate text-left hover:underline" onClick={onCopy}>
            {pin.name}
          </button>
        ) : href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="truncate no-underline hover:underline">
            {pin.name}
          </a>
        ) : (
          <span className="truncate">{pin.name}</span>
        )}
      </p>
      {pin.blurb ? <p className="mt-1 text-xs text-pretty text-muted-foreground">{pin.blurb}</p> : null}
      {pin.links.length ? <SocialRow links={pin.links.map((url) => ({ url, label: hostOf(url) }))} /> : null}
      <p className={cn("mt-2 font-mono text-[11px]", waiting ? "text-primary" : "text-muted-foreground")}>
        {waiting ? t("pinWaitLeft", { left }) : t("pinLeft", { left })}
      </p>
    </li>
  );
}

function hostOf(u: string) {
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return u;
  }
}
