import { useEffect, useState, type FormEvent } from "react";
import { ContributeQr } from "@/components/contribute-qr";
import { CaptchaBox, type CaptchaTicket } from "@/components/map/captcha";
import { PrivacyAccept } from "@/components/privacy-accept";
import { sendContact } from "@/infrastructure/server-fns";
import { useT, type CopyKey } from "@/lib/i18n";

const TOPICS = [
  { id: "general", label: "contactTopicGeneral", auto: "contactAutoGeneral" },
  { id: "map", label: "contactTopicMap", auto: "contactAutoMap" },
  { id: "dispute", label: "contactTopicDispute", auto: "contactAutoDispute" },
  { id: "events", label: "contactTopicEvents", auto: "contactAutoEvents" },
  { id: "collab", label: "contactTopicCollab", auto: "contactAutoCollab" },
] as const;

function postHiddenForm(action: string, fields: Record<string, string>) {
  return new Promise<void>((resolve) => {
    const iframe = document.createElement("iframe");
    const name = `bit-mail-${Date.now()}`;
    iframe.name = name;
    iframe.src = "about:blank";
    iframe.setAttribute("title", "mail");
    iframe.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;border:0";
    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    form.target = name;
    form.acceptCharset = "UTF-8";
    form.style.display = "none";
    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }
    let loads = 0;
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.setTimeout(() => {
        form.remove();
        iframe.remove();
      }, 4000);
      resolve();
    };
    iframe.addEventListener("load", () => {
      loads += 1;
      if (loads === 1) {
        form.submit();
        return;
      }
      done();
    });
    document.body.append(iframe, form);
    window.setTimeout(done, 8000);
  });
}

export function ContactBlock() {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["id"]>("general");
  const [listingId, setListingId] = useState("");
  const [hp, setHp] = useState("");
  const [captchaOk, setCaptchaOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [ticket, setTicket] = useState<CaptchaTicket | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [thanksName, setThanksName] = useState("");
  const [caseId, setCaseId] = useState("");
  const [err, setErr] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    try {
      const s = new URLSearchParams(window.location.search);
      const tp = s.get("topic");
      if (tp === "dispute" || tp === "map" || tp === "events" || tp === "collab" || tp === "general") setTopic(tp);
      const listing = s.get("listing") || "";
      if (listing) setListingId(listing.slice(0, 80));
    } catch {
      /* ignore */
    }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setOk(false);
    setHint("");
    if (!captchaOk) {
      setErr(t("captchaNeed"));
      return;
    }
    if (!privacyOk) {
      setErr(t("privacyAcceptNeed"));
      return;
    }
    setBusy(true);
    try {
      const autoKey = (TOPICS.find((x) => x.id === topic) ?? TOPICS[0]).auto;
      const auto = t(autoKey, { name: name.trim(), listing: listingId.trim() || "—" });
      const res = await sendContact({
        data: {
          name,
          email,
          message,
          topic,
          auto,
          listingId: listingId.trim(),
          hp,
          captchaId: ticket?.id,
          captcha: ticket?.answer,
          captchaNonce: ticket?.nonce,
        },
      });
      if (!res.ok) {
        if (res.error === "email") setErr(t("contactEmailBad"));
        else if (res.error === "need") setErr(t("contactNeed"));
        else if (res.error === "captcha") setErr(t("captchaNeed"));
        else if (res.error === "rate") setErr(t("contactRate"));
        else setErr(t("contactFail"));
        return;
      }
      const jobs: Promise<void>[] = [];
      if (res.relay) {
        jobs.push(
          postHiddenForm(res.relay, {
            name,
            email,
            message,
            topic: t(TOPICS.find((x) => x.id === topic)?.label as CopyKey),
            _subject: res.subject || "Contacto Bitacora",
            _replyto: email,
            _template: "table",
            _captcha: "false",
            _honey: "",
          }),
        );
      }
      if (res.ack) {
        jobs.push(
          postHiddenForm(res.ack, {
            name: "Bitácora.btc",
            email,
            message: auto,
            _subject: "Bitácora.btc · recibimos tu mensaje",
            _template: "box",
            _captcha: "false",
            _honey: "",
          }),
        );
      }
      if (jobs.length) await Promise.all(jobs);
      if (res.activate) setHint(t("contactActivate"));
      else setHint(t("contactAckHint"));
      setOk(true);
      setThanksName(name.trim());
      setCaseId(res.ticket || "");
      setName("");
      setEmail("");
      setMessage("");
      if (topic !== "dispute") setListingId("");
      setCaptchaOk(false);
      setPrivacyOk(false);
    } catch {
      setErr(t("contactFail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="space-y-4 rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-6">
      <header className="space-y-2">
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">{t("contactTitle")}</h2>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground sm:text-base">{t("contactLead")}</p>
      </header>
      <p className="text-sm font-medium text-foreground">{t("contactOrg")}</p>
      <p className="text-sm text-muted-foreground">{t("contactPlace")}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href="/mapa"
          className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-white no-underline hover:opacity-90"
        >
          {t("contactMap")}
        </a>
        <a
          href="/mapa"
          className="inline-flex h-9 items-center rounded-md bg-elevated px-3 text-sm font-medium text-foreground no-underline shadow-[var(--shadow-border)] hover:text-primary"
        >
          {t("contactJoin")}
        </a>
      </div>

      <form onSubmit={(e) => void submit(e)} className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-1">
          {t("contactName")}
          <input
            className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("contactPhName")}
            autoComplete="name"
            required
          />
        </label>
        <label className="block text-sm sm:col-span-1">
          {t("contactEmail")}
          <input
            type="email"
            className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("contactPhEmail")}
            autoComplete="email"
            required
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          {t("contactTopic")}
          <select
            className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
            value={topic}
            onChange={(e) => setTopic(e.target.value as (typeof TOPICS)[number]["id"])}
          >
            {TOPICS.map((x) => (
              <option key={x.id} value={x.id}>
                {t(x.label)}
              </option>
            ))}
          </select>
        </label>
        {topic === "dispute" || topic === "map" ? (
          <label className="block text-sm sm:col-span-2">
            {t("contactListing")}
            <input
              className="mt-1 h-10 w-full rounded-md bg-elevated px-3 font-mono text-sm shadow-[var(--shadow-border)]"
              value={listingId}
              onChange={(e) => setListingId(e.target.value.slice(0, 80))}
              placeholder={t("contactPhListing")}
            />
          </label>
        ) : null}
        <label className="block text-sm sm:col-span-2">
          {t("contactMsg")}
          <textarea
            className="mt-1 min-h-28 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("contactPhMsg")}
            minLength={2}
            required
          />
        </label>
        <div className="hidden" aria-hidden="true">
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <CaptchaBox key={ok ? "ok" : "form"} ok={captchaOk} onOk={setCaptchaOk} onTicket={setTicket} />
        </div>
        <div className="sm:col-span-2">
          <PrivacyAccept id="privacy-contact" checked={privacyOk} onChange={setPrivacyOk} />
        </div>
        {err ? (
          <p role="alert" className="text-sm text-short sm:col-span-2">
            {err}
          </p>
        ) : null}
        {ok ? (
          <p role="status" aria-live="polite" className="text-sm font-medium text-long sm:col-span-2">
            {t("contactOk", { name: thanksName })}
            {caseId ? ` ${t("contactTicketLine", { ticket: caseId })}` : ""}
          </p>
        ) : null}
        {hint ? <p className="text-xs text-muted-foreground sm:col-span-2">{hint}</p> : null}
        <p className="text-xs text-muted-foreground sm:col-span-2">{t("contactActivate")}</p>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2"
          disabled={busy || !captchaOk || !privacyOk}
        >
          {busy ? t("loading") : t("contactSend")}
        </button>
      </form>

      <ContributeQr />
    </article>
  );
}
