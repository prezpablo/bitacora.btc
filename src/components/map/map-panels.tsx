import { Star } from "lucide-react";
import { PrivacyAccept } from "@/components/privacy-accept";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CaptchaBox, type CaptchaTicket } from "./captcha";

export function StarMeter({ score, votes }: { score: number; votes: number }) {
  const avg = votes > 0 ? score : 0;
  const pct = Math.max(0, Math.min(100, (avg / 5) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex">
        <div className="flex text-muted-foreground">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="size-5" />
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <div className="flex text-primary">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className="size-5" fill="currentColor" />
            ))}
          </div>
        </div>
      </div>
      <span className="font-mono text-sm text-foreground">
        {avg.toFixed(1)} · {votes}
      </span>
    </div>
  );
}

export function MapDropPick({
  onShop,
  onComm,
  onCancel,
}: {
  onShop: () => void;
  onComm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  return (
    <div className="space-y-2">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("newPoint")}</p>
      <Button type="button" className="w-full" onClick={onShop}>
        {t("mapLoadShop")}
      </Button>
      <Button type="button" className="w-full" onClick={onComm}>
        {t("mapLoadComm")}
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
        {t("pinCancel")}
      </Button>
    </div>
  );
}

export function MapVotePanel({
  open,
  captchaKey,
  privacyId,
  nick,
  onNick,
  stars,
  onStars,
  draft,
  onDraft,
  captchaOk,
  onCaptcha,
  onTicket,
  privacyOk,
  onPrivacy,
  err,
  onPublish,
  onOpen,
  onHide,
  onDismiss,
}: {
  open: boolean;
  captchaKey: string;
  privacyId: string;
  nick: string;
  onNick: (v: string) => void;
  stars: 1 | 2 | 3 | 4 | 5;
  onStars: (n: 1 | 2 | 3 | 4 | 5) => void;
  draft?: string;
  onDraft?: (v: string) => void;
  captchaOk: boolean;
  onCaptcha: (ok: boolean) => void;
  onTicket: (t: CaptchaTicket | null) => void;
  privacyOk: boolean;
  onPrivacy: (ok: boolean) => void;
  err: string;
  onPublish: () => void;
  onOpen: () => void;
  onHide: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <Button type="button" className="w-full" onClick={onOpen}>
          {t("mapLoadVote")}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onDismiss}>
          {t("pinCancel")}
        </Button>
      </div>
    );
  }
  return (
    <>
      <label className="block text-sm">
        {t("fldNick")}
        <input
          className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
          value={nick}
          onChange={(e) => onNick(e.target.value)}
        />
      </label>
      {onDraft ? (
        <label className="block text-sm">
          {t("fldDesc")}
          <textarea
            className="mt-1 min-h-20 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
            value={draft ?? ""}
            onChange={(e) => onDraft(e.target.value)}
            placeholder={t("phVote")}
          />
        </label>
      ) : null}
      <div className="flex gap-1" role="group" aria-label={t("ratingAria")}>
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onStars(n)}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-md",
              n <= stars ? "text-primary" : "text-muted-foreground",
            )}
            aria-label={t("starsN", { n })}
          >
            <Star className="size-5" fill={n <= stars ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <CaptchaBox key={captchaKey} ok={captchaOk} onOk={onCaptcha} onTicket={onTicket} />
      <PrivacyAccept id={privacyId} checked={privacyOk} onChange={onPrivacy} />
      {err ? <p className="text-sm text-short">{err}</p> : null}
      <Button type="button" className="w-full" onClick={onPublish} disabled={!captchaOk || !privacyOk}>
        {t("publishVote")}
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={onHide}>
        {t("pinCancel")}
      </Button>
    </>
  );
}
