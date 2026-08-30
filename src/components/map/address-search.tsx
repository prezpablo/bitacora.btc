import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MapPin } from "lucide-react";
import { searchAddress } from "@/infrastructure/server-fns";
import { addressIssues, formatStreet, type AddrIssue, type StreetHit } from "@/infrastructure/address";
import { countryName } from "@/lib/display";
import { useLocale } from "@/lib/locale";
import { useT, type CopyKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ISSUE_COPY: Record<AddrIssue, CopyKey> = {
  pick: "addrNeedPick",
  street: "addrNeedStreet",
  number: "addrNeedNumber",
  city: "addrNeedCity",
  country: "addrNeedCountry",
  coords: "addrNeedCoords",
};

export function AddressSearch({
  value,
  onChange,
  onPick,
  hit,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (hit: StreetHit) => void;
  hit: StreetHit | null;
}) {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<StreetHit[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();
  const q = value.trim();
  const matched = Boolean(hit && q === formatStreet(hit, lang));
  const issues = matched ? addressIssues(hit) : q ? (["pick"] as AddrIssue[]) : (["pick"] as AddrIssue[]);
  const ok = matched && issues.length === 0;

  useEffect(() => {
    if (q.length < 3) {
      setHits([]);
      setLoading(false);
      return;
    }
    if (matched) return;
    setLoading(true);
    const id = window.setTimeout(() => {
      void searchAddress({ data: { q, lang } })
        .then((rows) => {
          setHits(rows);
          setActive(0);
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => window.clearTimeout(id);
  }, [q, lang, matched]);

  useEffect(() => {
    function hide(ev: MouseEvent) {
      if (!box.current?.contains(ev.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  function pick(next: StreetHit) {
    onChange(formatStreet(next, lang));
    onPick(next);
    setOpen(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || !hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = hits[active];
      if (row) pick(row);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={box} className="relative">
      <label className="block text-sm">
        {t("fldAddr")}
        <input
          className={cn(
            "mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]",
            ok && "ring-1 ring-long",
            q && !ok && "ring-1 ring-short",
          )}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={t("phAddr")}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={q && !ok ? true : undefined}
        />
      </label>
      {ok ? (
        <p className="mt-1 text-xs text-long">{t("addrValid")}</p>
      ) : q ? (
        <ul className="mt-1 space-y-0.5 text-xs text-short">
          {issues.map((k) => (
            <li key={k}>{t(ISSUE_COPY[k])}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{t("addrNeedPick")}</p>
      )}
      {open && q.length >= 3 && !matched ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md bg-card py-1 shadow-[var(--shadow-border)]"
        >
          {loading && !hits.length ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t("searching")}</li>
          ) : hits.length ? (
            hits.map((h, i) => {
              const bad = addressIssues(h);
              return (
                <li key={h.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2 text-left text-sm",
                      i === active ? "bg-elevated" : "",
                    )}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(h)}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <span className="block font-medium">{h.label}</span>
                      {h.city || h.countryCode ? (
                        <span className="block text-xs text-muted-foreground">
                          {[h.city, h.countryCode ? countryName(h.countryCode, lang, h.country || "") : h.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      ) : h.hint ? (
                        <span className="block text-xs text-muted-foreground">{h.hint}</span>
                      ) : null}
                      {bad.length ? (
                        <span className="block text-xs text-short">{t(ISSUE_COPY[bad[0]!])}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t("noHits")}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
