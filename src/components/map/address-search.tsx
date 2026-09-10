import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MapPin } from "lucide-react";
import { nearbyAddress, searchAddress } from "@/infrastructure/server-fns";
import { addressIssues, formatStreet, streetKey, streetMatchesQuery, type AddrIssue, type StreetHit } from "@/infrastructure/address";
import { countryName } from "@/lib/display";
import type { AppLang } from "@/lib/locale";
import { useAppLang, useT, type CopyKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ISSUE_COPY: Record<AddrIssue, CopyKey> = {
  pick: "addrNeedPick",
  street: "addrNeedStreet",
  number: "addrNeedNumber",
  city: "addrNeedCity",
  country: "addrNeedCountry",
  coords: "addrNeedCoords",
};

function HitRow({
  hit,
  active,
  onHover,
  onPick,
  lang,
}: {
  hit: StreetHit;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
  lang: AppLang;
}) {
  const t = useT();
  const bad = addressIssues(hit);
  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        className={cn("flex w-full items-start gap-2 px-3 py-2 text-left text-sm", active ? "bg-elevated" : "")}
        onMouseEnter={onHover}
        onClick={onPick}
      >
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          <span className="block font-medium">{hit.label}</span>
          {hit.city || hit.countryCode ? (
            <span className="block text-xs text-muted-foreground">
              {[hit.city, hit.countryCode ? countryName(hit.countryCode, lang, hit.country || "") : hit.country]
                .filter(Boolean)
                .join(", ")}
            </span>
          ) : hit.hint ? (
            <span className="block text-xs text-muted-foreground">{hit.hint}</span>
          ) : null}
          {bad.length ? <span className="block text-xs text-short">{t(ISSUE_COPY[bad[0]!])}</span> : null}
        </span>
      </button>
    </li>
  );
}

export function AddressSearch({
  value,
  onChange,
  onPick,
  hit,
  near,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (hit: StreetHit) => void;
  hit: StreetHit | null;
  near?: { lat: number; lon: number } | null;
}) {
  const t = useT();
  const lang = useAppLang();
  const [open, setOpen] = useState(false);
  const [free, setFree] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nearLoading, setNearLoading] = useState(false);
  const [hits, setHits] = useState<StreetHit[]>([]);
  const [nearby, setNearby] = useState<StreetHit[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const q = value.trim();
  const matched = Boolean(hit && q === formatStreet(hit, lang));
  const issues = matched ? addressIssues(hit) : [];
  const ok = matched && issues.length === 0;
  const block = q ? nearby.filter((h) => streetMatchesQuery(h, q)) : nearby;
  // Manzana primero. Photon (texto libre) solo si no hay match o eligió «Otra dirección».
  const showSearch = free || (q.length >= 2 && block.length === 0);
  const extra = hits.filter((h) => !block.some((n) => streetKey(n.street || n.label) === streetKey(h.street || h.label)));
  const menu = showSearch ? [...block, ...extra] : block;
  const otherIndex = free ? -1 : menu.length;
  const total = menu.length + (free ? 0 : 1);

  useEffect(() => {
    setFree(false);
    setHits([]);
  }, [near?.lat, near?.lon]);

  useEffect(() => {
    if (!near || !Number.isFinite(near.lat) || !Number.isFinite(near.lon)) {
      setNearby([]);
      return;
    }
    let stop = false;
    setNearLoading(true);
    void nearbyAddress({ data: { lat: near.lat, lon: near.lon, lang } })
      .then((rows) => {
        if (!stop) setNearby(rows);
      })
      .catch(() => {
        if (!stop) setNearby([]);
      })
      .finally(() => {
        if (!stop) setNearLoading(false);
      });
    return () => {
      stop = true;
    };
  }, [near?.lat, near?.lon, lang]);

  useEffect(() => {
    if (!showSearch || q.length < 2 || matched) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = window.setTimeout(() => {
      void searchAddress({ data: { q, lang, lat: near?.lat, lon: near?.lon } })
        .then((rows) => {
          setHits(rows);
          setActive(0);
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => window.clearTimeout(id);
  }, [q, lang, matched, showSearch, near?.lat, near?.lon]);

  useEffect(() => {
    function hide(ev: MouseEvent) {
      if (!box.current?.contains(ev.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  function pick(next: StreetHit) {
    setFree(false);
    onChange(formatStreet(next, lang));
    onPick(next);
    setOpen(false);
  }

  function pickOther() {
    // Escape hatch: vacía el campo y busca por lo que vaya escribiendo, sesgado al pin.
    setFree(true);
    onChange("");
    setHits([]);
    setActive(0);
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || !total) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(total - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!free && active === otherIndex) pickOther();
      else {
        const row = menu[active];
        if (row) pick(row);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const listOpen = open && Boolean(near);

  return (
    <div ref={box} className="relative">
      <label className="block text-sm">
        {t("fldAddr")}
        <input
          ref={inputRef}
          className={cn(
            "mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]",
            ok && "ring-1 ring-long",
          )}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={free ? t("phAddrOther") : t("phAddr")}
          autoComplete="off"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-autocomplete="list"
        />
      </label>
      {ok ? (
        <p className="mt-1 text-xs text-long">{hit?.fromMap ? t("addrFromPin") : t("addrValid")}</p>
      ) : listOpen ? (
        <p className="mt-1 text-xs text-muted-foreground">{free ? t("addrTypeOther") : t("addrNearHint")}</p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{t("addrOptional")}</p>
      )}
      {listOpen ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md bg-card py-1 shadow-[var(--shadow-border)]"
        >
          {!free && (nearby.length || nearLoading) ? (
            <li className="px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {t("addrNearHint").split(".")[0]}
            </li>
          ) : null}
          {nearLoading && !nearby.length ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t("searching")}</li>
          ) : null}
          {menu.map((h, i) => (
            <HitRow key={h.id} hit={h} active={i === active} onHover={() => setActive(i)} onPick={() => pick(h)} lang={lang} />
          ))}
          {!free ? (
            <li role="option" aria-selected={active === otherIndex}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm font-medium text-primary",
                  active === otherIndex ? "bg-elevated" : "",
                )}
                onMouseEnter={() => setActive(otherIndex)}
                onClick={pickOther}
              >
                {t("addrOther")}
              </button>
            </li>
          ) : null}
          {showSearch && loading && !hits.length ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t("searching")}</li>
          ) : null}
          {showSearch && !loading && q.length >= 2 && !menu.length && !nearLoading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t("noHits")}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
