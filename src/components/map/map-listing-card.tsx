import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { Community, MerchantLocal, MerchantPlace } from "@/domain";
import type { CircularPin } from "@/domain/map-csv";
import { GRADE_HEX, gradeOf, communityTrust, imgSrc, listingTrust, refineShopIcon, withFoundingProfile } from "@/domain";
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

export function CircularCard({ pin, onClose }: { pin: CircularPin; onClose: () => void }) {
  const t = useT();
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => {
    setImgOk(true);
  }, [pin.id, pin.logo]);
  const showImg = Boolean(imgSrc(pin.logo || "")) && imgOk;
  return (
    <div className="space-y-3">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("circularKind")}</p>
      <div className="flex items-center gap-3">
        <img src="/logos/economia-circular.png" alt="" width={56} height={56} className="size-14 rounded-full bg-white object-contain shadow-[var(--shadow-border)]" />
        <div>
          <h3 className="text-lg font-medium">{pin.name}</h3>
          <p className="text-sm text-muted-foreground">{pin.city}</p>
        </div>
      </div>
      {pin.description ? <p className="text-sm text-pretty">{pin.description}</p> : null}
      <div className="flex items-center gap-3">
        {showImg ? (
          <img
            src={imgSrc(pin.logo)}
            alt=""
            width={40}
            height={40}
            referrerPolicy="no-referrer"
            className="size-10 rounded-md bg-white object-contain"
            onError={() => setImgOk(false)}
          />
        ) : null}
        <p className="text-sm">{t("circularBy", { name: pin.steward || pin.name })}</p>
      </div>
      <SocialRow links={pin.links} />
      <Button type="button" variant="outline" className="w-full" onClick={onClose}>
        {t("pinCancel")}
      </Button>
    </div>
  );
}

export function CommunityCard({
  community: raw,
  onVerified,
}: {
  community: Community;
  onVerified: () => void;
  onPatched?: () => void;
}) {
  const t = useT();
  const community = withFoundingProfile(raw);
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
                else if (res.error === "medium") setProofErr(t("pinProofMedium"));
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
  const address = local?.address || place.address;
  const hours = local?.hours || place.hours;
  const links = local?.links?.length ? local.links : place.links;
  const pays = local?.pays?.length ? local.pays : place.pays;
  const description = local?.description || place.description;
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
      {description ? <p className="text-sm text-pretty text-foreground">{description}</p> : null}
      {local?.notes ? (
        <p className="text-sm text-pretty text-muted-foreground">
          <span className="font-medium text-foreground">{t("notesPrefix")} </span>
          {local.notes}
        </p>
      ) : null}
      {address ? <p className="text-sm text-muted-foreground">{address}</p> : null}
      {place.phone ? <p className="text-sm text-muted-foreground">{place.phone}</p> : null}
      {hours ? <HoursView hours={hours} /> : place.hoursText ? <p className="text-sm text-muted-foreground">{place.hoursText}</p> : null}
      {pays?.length ? <PayRow methods={pays} /> : null}
      {links?.length ? <SocialRow links={links} /> : null}
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
                else if (res.error === "medium") setProofErr(t("pinProofMedium"));
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
