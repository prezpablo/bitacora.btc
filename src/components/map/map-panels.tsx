import { Star } from "lucide-react";
import { PrivacyAccept } from "@/components/privacy-accept";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CaptchaBox, type CaptchaTicket } from "./captcha";
import { VerifyIgHow } from "./verify-ig-how";

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
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" size="sm" onClick={onShop}>
          {t("mapLoadShop")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onComm}>
          {t("mapLoadComm")}
        </Button>
      </div>
      <button type="button" className="w-full text-center text-xs text-muted-foreground hover:text-foreground" onClick={onCancel}>
        {t("pinCancel")}
      </button>
      <VerifyIgHow />
    </div>
  );
}

export function MapPlaceActions({
  onGo,
  going,
  onOpen,
  onPatch,
  onDismiss,
}: {
  onGo?: () => void;
  going?: boolean;
  onOpen: () => void;
  onPatch?: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {onGo ? (
        <Button
          type="button"
          size="sm"
          className="min-h-11 w-full whitespace-normal px-2 text-xs sm:min-h-9"
          disabled={going}
          onClick={onGo}
          title={going ? t("irWait") : t("ir")}
        >
          {going ? t("irWait") : t("ir")}
        </Button>
      ) : (
        <span />
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-border min-h-11 w-full whitespace-normal px-2 text-xs sm:min-h-9"
        onClick={onOpen}
        title={t("mapLoadVote")}
      >
        {t("mapLoadVoteShort")}
      </Button>
      {onPatch ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-border min-h-11 w-full whitespace-normal px-2 text-xs sm:min-h-9"
          onClick={onPatch}
        >
          {t("patchUpdate")}
        </Button>
      ) : (
        <span />
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-border min-h-11 w-full whitespace-normal px-2 text-xs sm:min-h-9"
        onClick={onDismiss}
      >
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
  onGo,
  going,
  onPatch,
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
  onGo?: () => void;
  going?: boolean;
  onPatch?: () => void;
}) {
  const t = useT();
  if (!open) {
    return <MapPlaceActions onGo={onGo} going={going} onOpen={onOpen} onPatch={onPatch} onDismiss={onDismiss} />;
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
        <span className="mt-1 block text-xs text-muted-foreground">{t("fldNickPublic")}</span>
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
      <PrivacyAccept id={privacyId} variant="publish" keep="listing" checked={privacyOk} onChange={onPrivacy} />
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
