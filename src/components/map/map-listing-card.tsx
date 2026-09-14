import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { Community, MerchantLocal, MerchantPlace } from "@/domain";
import { GRADE_HEX, gradeOf, communityTrust, imgSrc, listingTrust, refineShopIcon } from "@/domain";
import { pickListingLogo } from "@/domain/community-dedupe";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { verifyMapListing } from "@/infrastructure/server-fns";
import { HoursView } from "./hours-editor";
import { StarMeter } from "./map-panels";
import { PayRow } from "./pay-row";
import { SocialRow } from "./social-row";
import { VerifiedStar } from "./verified-star";
import { CargaProofStep } from "./carga-proof-step";

export function CommunityCard({
  community,
  onVerified,
}: {
  community: Community;
  onVerified: () => void;
  onPatched?: () => void;
}) {
  const t = useT();
  const trust = communityTrust(community);
  const [imgOk, setImgOk] = useState(true);
  const [proofErr, setProofErr] = useState("");
  const [proofBusy, setProofBusy] = useState(false);
  useEffect(() => {
    setImgOk(true);
  }, [community.id, community.logo]);
  const showImg = Boolean(imgSrc(community.logo || "")) && imgOk;
  const needsCarga = Boolean(community.verifyToken && !(community.verifiedAt ?? 0));
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
          {needsCarga ? <p className="mt-1 text-xs text-muted-foreground">{t("verifyPending")}</p> : null}
        </div>
      </div>
      {community.description ? <p className="text-sm text-pretty">{community.description}</p> : null}
      <SocialRow links={community.links} />
      {needsCarga ? (
        <CargaProofStep
          token={community.verifyToken!}
          name={community.name}
          busy={proofBusy}
          err={proofErr}
          onCheck={(proof) => {
            setProofBusy(true);
            setProofErr("");
            void verifyMapListing({ data: { id: community.id, token: community.verifyToken, proof } })
              .then((res) => {
                if (res.ok) onVerified();
                else if (res.error === "instagram") setProofErr(t("pinNoIg"));
                else if (res.error === "links" || res.error === "need") setProofErr(t("verifyNeedLink"));
                else setProofErr(t("pinProofFail"));
              })
              .finally(() => setProofBusy(false));
          }}
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
}: {
  place: MerchantPlace;
  local?: MerchantLocal;
  removable: boolean;
  onRemove: () => void;
  onVerified?: () => void;
  onPatched?: () => void;
}) {
  const t = useT();
  const g = gradeOf(local, Date.now());
  const overlay = place.id.startsWith("local:");
  const trust = listingTrust(local?.links, g?.avg ?? 0, g?.count ?? 0, (local?.verifiedAt ?? 0) > 0, overlay);
  const logo = pickListingLogo(local?.logo, place.logo);
  const [proofErr, setProofErr] = useState("");
  const [proofBusy, setProofBusy] = useState(false);
  const needsCarga = Boolean(local?.verifyToken && !(local?.verifiedAt ?? 0) && onVerified);
  const kind = refineShopIcon(place.category, place.name || local?.name);
  const kindLabel = kind === "shop" ? t("filterShops") : kind === "atm" ? "ATM" : kind;
  return (
    <>
      {kindLabel ? <p className="text-xs tracking-wide text-muted-foreground uppercase">{kindLabel}</p> : null}
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
      {needsCarga ? (
        <CargaProofStep
          token={local!.verifyToken!}
          name={place.name}
          busy={proofBusy}
          err={proofErr}
          onCheck={(proof) => {
            setProofBusy(true);
            setProofErr("");
            void verifyMapListing({ data: { id: place.id, token: local?.verifyToken, proof } })
              .then((res) => {
                if (res.ok) onVerified?.();
                else if (res.error === "instagram") setProofErr(t("pinNoIg"));
                else if (res.error === "links" || res.error === "need") setProofErr(t("verifyNeedLink"));
                else setProofErr(t("pinProofFail"));
              })
              .finally(() => setProofBusy(false));
          }}
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
