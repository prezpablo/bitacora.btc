import { useEffect, useMemo, useState } from "react";
import { Pin } from "lucide-react";
import { CaptchaBox } from "@/components/map/captcha";
import { cancelCommunityPin, getCommunityPins, submitCommunityPin, verifyCommunityPin } from "@/infrastructure/server-fns";
import { pinDaysLeft, pinPending, pinWeekPose, type CommunityPin } from "@/domain/community-pins";
import { useQuery } from "@tanstack/react-query";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PENDING_KEY = "bitacora-pin-pending";

type Pending = { id: string; token: string; name: string; proof: string };

function readPending(): Pending | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY) || localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending;
    if (!p.id || !p.token) return null;
    return p;
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    setPending(readPending());
  }, []);

  function keepPending(p: Pending | null) {
    setPending(p);
    writePending(p);
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
        created: Date.now(),
      });
    }
    return rows.sort((a, b) => pinWeekPose(a.id).order - pinWeekPose(b.id).order);
  }, [q.data, pending]);

  async function submit() {
    setErr("");
    if (!captchaOk) {
      setErr(t("captchaNeed"));
      return;
    }
    const proofUrl = proof.trim().match(/^https?:\/\//i) ? proof.trim() : `https://${proof.trim()}`;
    if (!name.trim() || !proof.trim()) {
      setErr(t("pinNeed"));
      return;
    }
    setBusy(true);
    try {
      const extra = links
        .split(/[\s,|]+/)
        .map((u) => u.trim())
        .filter(Boolean)
        .map((u) => (u.match(/^https?:\/\//i) ? u : `https://${u}`));
      const res = await submitCommunityPin({ data: { name: name.trim(), blurb, proof: proofUrl, links: extra } });
      if (!res?.ok || !res.token || !res.id) {
        setErr(res?.error === "rate" ? t("pinRate") : res?.error === "save" ? t("pinSaveFail") : t("pinNeed"));
        return;
      }
      keepPending({ id: res.id, token: res.token, name: name.trim(), proof: proofUrl });
      await q.refetch();
    } catch {
      setErr(t("pinNeed"));
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    if (!pending) return;
    setBusy(true);
    setErr("");
    try {
      const res = await verifyCommunityPin({ data: { id: pending.id } });
      if (!res.ok) {
        setErr(t("pinProofFail"));
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

  async function cancel() {
    if (!pending) return;
    setBusy(true);
    setErr("");
    try {
      await cancelCommunityPin({ data: { id: pending.id } });
    } catch {
      /* still drop local hold */
    }
    keepPending(null);
    setBusy(false);
  }

  async function copyCode() {
    if (!pending) return;
    try {
      await navigator.clipboard.writeText(pending.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr(pending.token);
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
              <PinCard key={p.id} pin={p} />
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("pinEmpty")}</p>
        )}
      </div>

      <div className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        <p className="text-sm font-medium text-foreground">{t("pinFormTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("pinHow")}</p>
        {pending ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-foreground">{t("pinPostCode")}</p>
            <button
              type="button"
              onClick={() => void copyCode()}
              className="block w-full rounded-md bg-primary px-3 py-3 text-center font-mono text-2xl font-bold tracking-widest text-white sm:text-3xl"
              title={t("pinCopy")}
            >
              {pending.token}
            </button>
            <p className="text-xs text-muted-foreground">
              {copied ? t("pinCopied") : t("pinPostHint")}
            </p>
            {pending.proof ? (
              <p className="truncate text-xs text-muted-foreground">
                {pending.name ? `${pending.name} · ` : ""}
                {pending.proof}
              </p>
            ) : null}
            {err ? <p className="text-sm text-primary">{err}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-50"
                onClick={() => void check()}
                disabled={busy}
              >
                {t("pinCheck")}
              </button>
              <button
                type="button"
                className="h-9 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground disabled:opacity-50"
                onClick={() => void cancel()}
                disabled={busy}
              >
                {t("pinCancel")}
              </button>
            </div>
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
              <span className="text-muted-foreground">{t("pinName")}</span>
              <input
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
              />
            </label>
            <label className="block text-sm sm:col-span-1">
              <span className="text-muted-foreground">{t("pinProof")}</span>
              <input
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="URL"
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
              <CaptchaBox key="pin" ok={captchaOk} onOk={setCaptchaOk} />
            </div>
            {err ? <p className="text-sm text-primary sm:col-span-2">{err}</p> : null}
            <button
              type="submit"
              className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2"
              disabled={busy}
            >
              {t("pinSubmit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PinCard({ pin }: { pin: CommunityPin }) {
  const t = useT();
  const pose = pinWeekPose(pin.id);
  const days = pinDaysLeft(pin);
  const waiting = pinPending(pin);
  const href = pin.proof;
  return (
    <li
      className="w-[min(100%,16.5rem)] rounded-md border border-border bg-background p-3 shadow-[var(--shadow-border)]"
      style={{ transform: `rotate(${pose.rot}deg)` }}
    >
      <p className="flex items-center gap-1.5 font-medium text-foreground">
        <Pin className="size-4 shrink-0 text-primary" aria-hidden />
        <a href={href} target="_blank" rel="noreferrer" className="truncate no-underline hover:underline">
          {pin.name}
        </a>
      </p>
      {pin.blurb ? <p className="mt-1 text-xs text-pretty text-muted-foreground">{pin.blurb}</p> : null}
      {pin.links.length ? (
        <p className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
          {pin.links.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer" className="truncate text-primary">
              {hostOf(u)}
            </a>
          ))}
        </p>
      ) : null}
      <p className={cn("mt-2 font-mono text-[11px]", waiting ? "text-primary" : "text-muted-foreground")}>
        {waiting ? t("pinWait") : t("pinDays", { n: days })}
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
