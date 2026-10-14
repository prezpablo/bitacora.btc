import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CaptchaBox, type CaptchaTicket } from "@/components/map/captcha";
import { PrivacyAccept } from "@/components/privacy-accept";
import { CargaPendingView, holdCargaSpinner } from "@/components/map/carga-proof-step";
import { cancelExperience, getExperiences, submitExperience, verifyExperience } from "@/infrastructure/server-fns";
import { LEGAL } from "@/domain/legal-config";
import { useT } from "@/lib/i18n";
import { fieldErr } from "@/lib/field-err";

const PENDING_KEY = "bitacora-xp-pending";

type Pending = { id: string; token: string; activity: string };

function readPending(): Pending | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending;
    if (!p.id || !p.token) return null;
    return p;
  } catch {
    return null;
  }
}

export function ExperiencesBoard() {
  const t = useT();
  const q = useQuery({ queryKey: ["experiences"], queryFn: () => getExperiences(), staleTime: 60_000 });
  const [activity, setActivity] = useState("");
  const [city, setCity] = useState("");
  const [when, setWhen] = useState("");
  const [recurrent, setRecurrent] = useState(false);
  const [price, setPrice] = useState("");
  const [deal, setDeal] = useState(false);
  const [captchaOk, setCaptchaOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [ticket, setTicket] = useState<CaptchaTicket | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const errId = useId();
  const cityBad = err === t("xpNeedCity");
  const whenBad = err === t("xpNeedWhen");
  const priceBad = err === t("xpNeedPrice");
  const captchaBad = err === t("captchaNeed") || err === t("captchaSlow");
  const privacyBad = err === t("privacyAcceptNeed");
  const [pending, setPending] = useState<Pending | null>(null);
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPending(readPending());
  }, []);

  function keep(p: Pending | null) {
    setPending(p);
    try {
      if (!p) sessionStorage.removeItem(PENDING_KEY);
      else sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
    } catch {
      /* quota */
    }
  }

  function reset() {
    setActivity("");
    setCity("");
    setWhen("");
    setRecurrent(false);
    setPrice("");
    setDeal(false);
    setCaptchaOk(false);
    setPrivacyOk(false);
    setTicket(null);
    setErr("");
    setOpen(false);
    setGenerating(false);
  }

  function fail(code?: string) {
    if (code === "captcha") setErr(t("captchaSlow"));
    else if (code === "rate") setErr(t("xpRate"));
    else if (code === "city") setErr(t("xpNeedCity"));
    else if (code === "when") setErr(t("xpNeedWhen"));
    else if (code === "price") setErr(t("xpNeedPrice"));
    else if (code === "instagram") setErr(t("pinNoIg"));
    else if (code === "proof" || code === "need" || code === "links") setErr(t("verifyNeedLink"));
    else setErr(t("xpFail"));
  }

  async function submit() {
    if (!privacyOk) {
      setErr(t("privacyAcceptNeed"));
      return;
    }
    if (!ticket) {
      setErr(t("captchaNeed"));
      return;
    }
    setBusy(true);
    setGenerating(true);
    setErr("");
    const started = Date.now();
    try {
      const res = await submitExperience({
        data: {
          activity,
          city,
          when,
          recurrent,
          price,
          deal,
          captchaId: ticket.id,
          captcha: ticket.answer,
          captchaNonce: ticket.nonce,
          consent: true,
          textVersion: LEGAL.consentVersion,
          form: "experience",
        },
      });
      await holdCargaSpinner(started);
      if (res.ok && res.id && res.token) keep({ id: res.id, token: res.token, activity: activity.trim() });
      else fail(res.error);
    } catch {
      fail();
    } finally {
      setBusy(false);
      setGenerating(false);
    }
  }

  async function check(url: string) {
    if (!pending) return;
    setBusy(true);
    setErr("");
    try {
      const res = await verifyExperience({ data: { id: pending.id, proof: url } });
      if (!res.ok) fail(res.error);
      else {
        keep(null);
        reset();
        await q.refetch();
      }
    } catch {
      fail();
    } finally {
      setBusy(false);
    }
  }

  const rows = q.data || [];
  const ready = activity.trim().length >= 2 && city.trim().length >= 2 && (recurrent || /^\d{4}-\d{2}-\d{2}$/.test(when)) && (deal || /^\d+$/.test(price)) && captchaOk && privacyOk;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{t("xpTitle")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-pretty text-muted-foreground">{t("xpLead")}</p>
        <p className="mt-1 max-w-2xl text-sm text-pretty text-muted-foreground">{t("xpCustody")}</p>
      </div>
      {rows.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium text-foreground">{row.activity}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {row.city}
                {" · "}
                {row.when === "recurrente" ? t("xpRecurrent") : row.when}
                {" · "}
                {row.price === "convenio" ? t("xpDeal") : t("xpSats").replace("{n}", row.price)}
              </p>
              <a href={row.proof} className="mt-2 inline-block text-sm text-primary no-underline hover:underline" rel="noopener noreferrer">
                {t("xpProof")}
              </a>
              <p className="mt-2 text-xs text-pretty text-muted-foreground">{t("xpCustody")}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-[var(--shadow-border)]">{t("xpEmpty")}</p>
      )}
      <div className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        {pending || generating ? (
          <CargaPendingView
            generating={generating}
            token={pending?.token}
            name={pending?.activity}
            busy={busy}
            err={err}
            onCheck={(url) => void check(url)}
            onCancel={() => {
              if (pending) void cancelExperience({ data: { id: pending.id, token: pending.token } });
              keep(null);
              reset();
            }}
          />
        ) : open ? (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <p className="text-xs text-muted-foreground sm:col-span-2">{t("reqHint")}</p>
            <label className="block text-sm sm:col-span-2">
              {t("xpActivity")}{" "}
              <span className="text-primary" aria-hidden="true">*</span>
              <input className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]" value={activity} onChange={(e) => setActivity(e.target.value)} maxLength={120} required aria-required="true" />
            </label>
            <label className="block text-sm">
              {t("xpCity")}{" "}
              <span className="text-primary" aria-hidden="true">*</span>
              <input className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} required aria-required="true" {...fieldErr(errId, cityBad)} />
            </label>
            <label className="block text-sm">
              {t("xpWhen")}
              <input type="date" className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]" value={recurrent ? "" : when} disabled={recurrent} onChange={(e) => setWhen(e.target.value)} {...fieldErr(errId, whenBad)} />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={recurrent} onChange={(e) => setRecurrent(e.target.checked)} />
              {t("xpRecurrent")}
            </label>
            <label className="block text-sm">
              {t("xpPrice")}
              <input inputMode="numeric" className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]" value={deal ? "" : price} disabled={deal} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, "").slice(0, 9))} placeholder="21000" {...fieldErr(errId, priceBad)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={deal} onChange={(e) => setDeal(e.target.checked)} />
              {t("xpDeal")}
            </label>
            <div className="sm:col-span-2">
              <PrivacyAccept id="privacy-xp" variant="publish" keep="xp" checked={privacyOk} onChange={setPrivacyOk} invalid={privacyBad} describedBy={privacyBad ? errId : undefined} />
            </div>
            <div className="sm:col-span-2">
              <CaptchaBox ok={captchaOk} onOk={setCaptchaOk} onTicket={setTicket} invalid={captchaBad} describedBy={captchaBad ? errId : undefined} />
            </div>
            {err ? <p id={errId} role="alert" className="text-sm text-primary sm:col-span-2">{err}</p> : null}
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button type="submit" className="h-10 rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-50" disabled={busy || !ready}>
                {t("pinSubmit")}
              </button>
              <button type="button" className="h-10 rounded-md bg-elevated px-3 text-sm" onClick={reset}>
                {t("pinCancel")}
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="h-10 w-full rounded-md bg-primary px-3 text-sm font-medium text-white" onClick={() => setOpen(true)}>
            {t("xpNew")}
          </button>
        )}
      </div>
    </div>
  );
}
