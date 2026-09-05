import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import type { Community, MerchantLocal, MerchantPlace } from "@/domain";
import { GRADE_HEX, gradeOf, communityTrust, imgSrc, listingTrust } from "@/domain";
import { pickListingLogo } from "@/domain/community-dedupe";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { verifyMapListing } from "@/infrastructure/server-fns";
import { HoursView } from "./hours-editor";
import { StarMeter } from "./map-panels";
import { PayRow } from "./pay-row";
import { SocialRow } from "./social-row";
import { VerifiedStar } from "./verified-star";
import { VerifyIgHow } from "./verify-ig-how";

export function CommunityCard({
  community,
  onVerified,
  onPatched,
  onPatch,
}: {
  community: Community;
  onVerified: () => void;
  onPatched?: () => void;
  onPatch?: () => void;
}) {
  const t = useT();
  const trust = communityTrust(community);
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => {
    setImgOk(true);
  }, [community.id, community.logo]);
  const showImg = Boolean(imgSrc(community.logo || "")) && imgOk;
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1 text-xs tracking-wide text-muted-foreground uppercase">
        <Users className="size-3.5" />
        {t("modeComm")}
      </p>
      <div className="flex items-center gap-3">
        {showImg ? (
          <img
            src={imgSrc(community.logo || "")}
            alt=""
            referrerPolicy="no-referrer"
            className="size-16 rounded-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            ₿
          </span>
        )}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium">
            {community.name}
            {trust.verified ? <VerifiedStar title={t("verified")} className="size-7" /> : null}
          </h3>
          <p className="font-mono text-xs text-muted-foreground">@{community.slug}</p>
          {!trust.verified ? <p className="mt-1 text-xs text-muted-foreground">{t("verifyPending")}</p> : null}
        </div>
      </div>
      {onPatch ? (
        <Button type="button" size="sm" className="w-full" onClick={onPatch}>
          {t("patchUpdate")}
        </Button>
      ) : null}
      {community.description ? <p className="text-sm text-pretty">{community.description}</p> : null}
      <SocialRow links={community.links} />
      {!trust.verified && community.verifyToken ? (
        <ScrapeVerifyBox
          id={community.id}
          token={community.verifyToken}
          hasLinks={community.links.length > 0}
          onVerified={onVerified}
        />
      ) : null}
    </div>
  );
}

export function PlaceCard({
  place,
  local,
  removable,
  onRemove,
  onVerified,
  onPatched,
  onPatch,
}: {
  place: MerchantPlace;
  local?: MerchantLocal;
  removable: boolean;
  onRemove: () => void;
  onVerified?: () => void;
  onPatched?: () => void;
  onPatch?: () => void;
}) {
  const t = useT();
  const g = gradeOf(local, Date.now());
  const trust = listingTrust(local?.links, g?.avg ?? 0, g?.count ?? 0, (local?.verifiedAt ?? 0) > 0);
  const logo = pickListingLogo(local?.logo, place.logo);
  return (
    <>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{place.category}</p>
      <div className="flex items-center gap-3">
        {logo ? (
          <img src={imgSrc(logo)} alt="" className="size-14 rounded-full object-cover" />
        ) : (
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
            ₿
          </span>
        )}
        <h3 className="flex items-center gap-2 text-lg font-medium text-foreground">
          {place.name}
          {trust.verified ? <VerifiedStar title={t("verified")} className="size-7" /> : null}
        </h3>
      </div>
      {onPatch ? (
        <Button type="button" size="sm" className="w-full" onClick={onPatch}>
          {t("patchUpdate")}
        </Button>
      ) : null}
      {g ? (
        <div className="space-y-1">
          <StarMeter score={g.avg ?? 0} votes={g.count} />
          <p className="text-sm" style={{ color: GRADE_HEX[g.band] }}>
            {g.band === "baja"
              ? t("gradeLow")
              : g.band === "media"
                ? t("gradeMid")
                : g.band === "alta"
                  ? t("gradeHigh")
                  : t("gradeNew")}
            {g.avg != null ? ` · ${g.avg.toFixed(1)}/5` : ""} ·{" "}
            {g.count === 1 ? t("gradeNotes1") : t("gradeNotesN", { n: g.count })}
          </p>
        </div>
      ) : null}
      {local?.description ? <p className="text-sm text-pretty text-foreground">{local.description}</p> : null}
      {local?.notes ? (
        <p className="text-sm text-pretty text-muted-foreground">
          <span className="font-medium text-foreground">{t("notesPrefix")} </span>
          {local.notes}
        </p>
      ) : null}
      {local?.address ? <p className="text-sm text-muted-foreground">{local.address}</p> : null}
      {local?.hours ? <HoursView hours={local.hours} /> : null}
      {local?.pays?.length ? <PayRow methods={local.pays} /> : null}
      {local?.links?.length ? <SocialRow links={local.links} /> : null}
      {!trust.verified && local?.verifyToken && onVerified ? (
        <ScrapeVerifyBox
          id={place.id}
          token={local.verifyToken}
          hasLinks={(local.links?.length ?? 0) > 0}
          onVerified={onVerified}
        />
      ) : null}
      {removable ? (
        <Button variant="outline" className="w-full" onClick={onRemove}>
          {t("removeLow")}
        </Button>
      ) : null}
    </>
  );
}

function ScrapeVerifyBox({
  id,
  token,
  hasLinks,
  onVerified,
}: {
  id: string;
  token?: string;
  hasLinks: boolean;
  onVerified: () => void;
}) {
  const t = useT();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const doneFn = useRef(onVerified);
  doneFn.current = onVerified;
  useEffect(() => {
    if (!token || !hasLinks) return;
    let stop = false;
    const tick = async () => {
      setBusy(true);
      try {
        const res = await verifyMapListing({ data: { id, token } });
        if (stop) return;
        if (res.ok) doneFn.current();
        else if (res.error === "links") setErr(t("verifyNeedLink"));
      } catch {
        /* next */
      } finally {
        if (!stop) setBusy(false);
      }
    };
    const n = window.setInterval(() => void tick(), 10000);
    const first = window.setTimeout(() => void tick(), 2000);
    return () => {
      stop = true;
      window.clearInterval(n);
      window.clearTimeout(first);
    };
  }, [id, token, hasLinks, t]);
  if (!token) return null;
  return (
    <div className="space-y-2 rounded-md bg-elevated px-3 py-2 text-sm">
      <p className="text-muted-foreground">{t("verifyScrapeHint")}</p>
      <p>
        <code className="rounded bg-primary px-1.5 py-0.5 font-mono text-sm font-bold text-white">{token}</code>
      </p>
      <VerifyIgHow />
      {!hasLinks ? <p className="text-primary">{t("verifyNeedLink")}</p> : null}
      {err ? <p className="text-primary">{err}</p> : null}
      <Button
        type="button"
        className="w-full"
        disabled={busy || !hasLinks || !token}
        onClick={() => {
          if (!token) return;
          setBusy(true);
          void verifyMapListing({ data: { id, token } })
            .then((res) => {
              if (res.ok) onVerified();
              else setErr(res.error === "links" ? t("verifyNeedLink") : t("pinProofFail"));
            })
            .finally(() => setBusy(false));
        }}
      >
        {t("pinCheck")}
      </Button>
    </div>
  );
}
