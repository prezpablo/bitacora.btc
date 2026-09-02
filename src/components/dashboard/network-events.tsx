import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, Locate, MapPin } from "lucide-react";
import type { ContinentId, EventKind, NetworkEvent } from "@/domain";
import { continentOf, eventIsLive } from "@/domain";
import { getCityFrame } from "@/infrastructure/server-fns";
import { useMapEvents } from "@/lib/map-query";
import { locateBest } from "@/infrastructure/geo";
import { countryName as namedCountry, localeTag } from "@/lib/display";
import { useLocale, type AppLang } from "@/lib/locale";
import { useT, type CopyKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const KIND_COPY: { key: EventKind; label: CopyKey }[] = [
  { key: "meetup", label: "netKindMeetup" },
  { key: "conference", label: "netKindConf" },
  { key: "workshop", label: "netKindWork" },
  { key: "hackathon", label: "netKindHack" },
  { key: "online", label: "netKindOnline" },
  { key: "other", label: "netKindOther" },
];

const CONTINENTS: { key: ContinentId; label: CopyKey }[] = [
  { key: "americas", label: "netAm" },
  { key: "europe", label: "netEu" },
  { key: "africa", label: "netAf" },
  { key: "asia", label: "netAs" },
  { key: "oceania", label: "netOc" },
  { key: "online", label: "netOnlineCont" },
];

function eventContinent(e: NetworkEvent): ContinentId | "" {
  if (e.kind === "online") return "online";
  return e.continent || continentOf(e.countryCode);
}

function sameCountry(e: NetworkEvent, code: string, name?: string) {
  const want = code.toUpperCase();
  const got = (e.countryCode || "").toUpperCase();
  if (want && got && got === want) return true;
  if (name && e.country && e.country.toLowerCase() === name.toLowerCase()) return true;
  return false;
}

function fmtDate(ts: number, tz?: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: tz || undefined,
    })
      .format(new Date(ts))
      .replace(/\//g, "-");
  } catch {
    const d = new Date(ts);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
  }
}

function fmtTime(ts: number, tz?: string, lang: AppLang = "es") {
  const tag = localeTag(lang);
  try {
    return new Intl.DateTimeFormat(tag, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz || undefined,
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit", hour12: false });
  }
}

function fmtRange(start: number, end: number | undefined, tz: string | undefined, lang: AppLang) {
  const a = fmtTime(start, tz, lang);
  const b = end ? fmtTime(end, tz, lang) : "";
  return b ? `${a}–${b}` : a;
}

function EventCard({ ev, lang }: { ev: NetworkEvent; lang: AppLang }) {
  const t = useT();
  const online = ev.kind === "online";
  const place = online
    ? t("netKindOnline")
    : [ev.city || ev.region, namedCountry(ev.countryCode, lang, ev.country)].filter(Boolean).join(", ");
  const utc = fmtRange(ev.startAt, ev.endAt, "UTC", lang);
  const local = fmtRange(ev.startAt, ev.endAt, undefined, lang);
  const eventTz = fmtRange(ev.startAt, ev.endAt, ev.timezone, lang);
  return (
    <article className="flex flex-col overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]">
      <div className="relative aspect-[16/9] bg-plot">
        {ev.image ? (
          <img src={ev.image} alt={ev.title} className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-4xl text-primary">₿</span>
        )}
        <span className="absolute top-2 left-2 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">
          {ev.platform}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="text-base font-medium text-pretty text-foreground">{ev.title}</h3>
        {ev.description ? <p className="text-sm text-pretty text-muted-foreground">{ev.description}</p> : null}
        <ul className="mt-auto space-y-0.5 font-mono text-xs text-muted-foreground">
          <li>
            {t("netDate")}: {fmtDate(ev.startAt, online ? "UTC" : ev.timezone)}
          </li>
          {online ? (
            <>
              <li className="flex flex-wrap items-center gap-2">
                <span>{t("netTime")}:</span>
                <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-[11px] text-white">
                  {utc} {t("netUtc")}
                </span>
              </li>
              <li>
                {t("netLocal")}: {local}
              </li>
            </>
          ) : (
            <li>
              {t("netTime")}: {eventTz}
            </li>
          )}
          <li>
            {t("netCountry")}: {place || "—"}
          </li>
        </ul>
        <a
          href={ev.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-white no-underline"
        >
          {t("netEnter")}
        </a>
      </div>
    </article>
  );
}

const selectClass =
  "h-10 min-w-40 rounded-md bg-elevated px-2.5 text-sm shadow-[var(--shadow-border)] disabled:opacity-40";

function GeoMenu({
  label,
  allLabel,
  groups,
  continent,
  country,
  onAll,
  onContinent,
  onCountry,
}: {
  label: string;
  allLabel: string;
  groups: { key: ContinentId; title: string; countries: [string, string][] }[];
  continent: ContinentId | "";
  country: string;
  onAll: () => void;
  onContinent: (id: ContinentId) => void;
  onCountry: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        className={cn(selectClass, "inline-flex min-w-48 items-center justify-between gap-2 text-left")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 max-h-80 min-w-56 overflow-auto rounded-md bg-card py-1 shadow-[var(--shadow-border)]">
          <button
            type="button"
            className={cn(
              "block w-full px-3 py-1.5 text-left text-sm",
              !continent && !country ? "bg-primary text-white" : "text-foreground hover:bg-elevated",
            )}
            onClick={() => {
              onAll();
              setOpen(false);
            }}
          >
            {allLabel}
          </button>
          {groups.map((g) => (
            <div key={g.key} className="mt-1">
              <button
                type="button"
                className={cn(
                  "block w-full px-3 py-1.5 text-left text-sm font-bold",
                  continent === g.key && !country
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-elevated",
                )}
                onClick={() => {
                  onContinent(g.key);
                  setOpen(false);
                }}
              >
                {g.title}
              </button>
              {g.countries.map(([code, name]) => (
                <button
                  key={code}
                  type="button"
                  className={cn(
                    "block w-full px-6 py-1 text-left text-sm",
                    country === code ? "bg-primary text-white" : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                  )}
                  onClick={() => {
                    onCountry(code);
                    setOpen(false);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function NetworkEvents() {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const q = useMapEvents();
  const [country, setCountry] = useState("");
  const [continent, setContinent] = useState<ContinentId | "">("");
  const [platform, setPlatform] = useState("");
  const [kind, setKind] = useState<EventKind | "">("");
  const [near, setNear] = useState(false);
  const [countryName, setCountryName] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const all = useMemo(
    () => (q.data?.events ?? []).filter((e) => eventIsLive(e, now)),
    [q.data, now],
  );

  const countriesByContinent = useMemo(() => {
    const map = new Map<ContinentId, Map<string, string>>();
    for (const e of all) {
      const cont = eventContinent(e);
      if (!cont || !e.countryCode) continue;
      if (cont === "online") continue;
      let inner = map.get(cont);
      if (!inner) {
        inner = new Map();
        map.set(cont, inner);
      }
      inner.set(e.countryCode, namedCountry(e.countryCode, lang, e.country || e.countryCode));
    }
    return CONTINENTS.map((c) => {
      const inner = map.get(c.key);
      const list = inner
        ? [...inner.entries()].sort((a, b) => a[1].localeCompare(b[1], lang))
        : [];
      return { ...c, countries: list };
    });
  }, [all, lang]);

  const platforms = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of all) {
      if (continent && eventContinent(e) !== continent) continue;
      if (country && !sameCountry(e, country, countryName)) continue;
      map.set(e.platform, (map.get(e.platform) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], lang));
  }, [all, continent, country, countryName, lang]);

  const scoped = useMemo(() => {
    return all.filter((e) => {
      if (continent && eventContinent(e) !== continent) return false;
      if (country && !sameCountry(e, country, countryName)) return false;
      if (platform && e.platform !== platform) return false;
      return true;
    });
  }, [all, continent, country, countryName, platform]);

  const kindCounts = useMemo(() => {
    const c: Partial<Record<EventKind, number>> = {};
    for (const e of scoped) c[e.kind] = (c[e.kind] || 0) + 1;
    return c;
  }, [scoped]);

  const local = kind ? scoped.filter((e) => e.kind === kind) : scoped;
  const rows = local;
  const emptyCountry = Boolean(country) && scoped.length === 0 && all.length > 0;
  const countryLabel = country
    ? namedCountry(
        country,
        lang,
        countriesByContinent.flatMap((g) => g.countries).find(([c]) => c === country)?.[1] ||
          countryName ||
          country,
      )
    : "";

  async function nearYou() {
    if (near) {
      setNear(false);
      setCountry("");
      setContinent("");
      setCountryName("");
      setGeoErr("");
      return;
    }
    setLocating(true);
    setGeoErr("");
    try {
      const frame = (lat: number, lon: number, zoom: number) =>
        getCityFrame({ data: { lat, lon, zoom } }).catch(() => ({
          lat,
          lon,
          south: lat,
          north: lat,
          west: lon,
          east: lon,
          label: "",
        }));
      let located;
      try {
        located = await locateBest(true, frame);
      } catch {
        located = await locateBest(false, frame);
      }
      const code = (located.city.countryCode || located.fix.countryCode || "").toUpperCase();
      const name = located.city.country || located.fix.country || "";
      if (!code) {
        setGeoErr(t("netGeoFail"));
        return;
      }
      setCountry(code);
      setCountryName(name);
      setContinent(continentOf(code) || "");
      setNear(true);
    } catch {
      setGeoErr(t("netGeoFail"));
    } finally {
      setLocating(false);
    }
  }

  function pickCountry(code: string) {
    setCountry(code);
    setCountryName("");
    setNear(false);
    setGeoErr("");
    if (code) {
      const next = continentOf(code);
      if (next) setContinent(next);
    }
  }

  function pickContinent(id: ContinentId | "") {
    setContinent(id);
    setCountry("");
    setNear(false);
    setGeoErr("");
  }

  const dirty = Boolean(country || kind || near || continent || platform);

  return (
    <section className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-2xl font-medium tracking-tight text-foreground">
          <Calendar className="size-5 text-primary" aria-hidden />
          {t("netTitle")}
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">{t("netLead")}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          className="gap-2"
          variant={near ? "default" : "outline"}
          onClick={() => void nearYou()}
          disabled={locating}
        >
          <Locate className="size-4" />
          {locating ? t("geoWait") : near ? t("netNearOn", { c: countryLabel || country }) : t("netNear")}
        </Button>
        {(platforms.length ? platforms : platform ? [[platform, 0] as [string, number]] : []).map(([name, n]) => (
          <Button
            key={name}
            type="button"
            className={cn(
              "gap-1 bg-primary text-white hover:bg-primary hover:text-white hover:opacity-90",
              platform === name ? "ring-2 ring-white" : "opacity-90",
            )}
            variant="default"
            onClick={() => setPlatform((cur) => (cur === name ? "" : name))}
            aria-pressed={platform === name}
          >
            {name}
            <span className="font-mono text-xs text-white">{n}</span>
          </Button>
        ))}
        <GeoMenu
          label={countryLabel || (continent ? t(CONTINENTS.find((c) => c.key === continent)?.label || "netContinentAll") : t("netCountryAll"))}
          allLabel={t("netCountryAll")}
          continent={continent}
          country={country}
          groups={countriesByContinent
            .filter((g) => g.key === "online" || g.countries.length > 0 || continent === g.key)
            .map((g) => ({ key: g.key, title: t(g.label), countries: g.countries }))}
          onAll={() => {
            pickContinent("");
            pickCountry("");
          }}
          onContinent={pickContinent}
          onCountry={pickCountry}
        />
        {dirty ? (
          <button
            type="button"
            className="h-10 px-2 text-sm text-primary"
            onClick={() => {
              setCountry("");
              setKind("");
              setContinent("");
              setPlatform("");
              setNear(false);
              setCountryName("");
              setGeoErr("");
            }}
          >
            {t("netClear")}
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {KIND_COPY.filter((k) => (kindCounts[k.key] || 0) > 0).map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKind((cur) => (cur === k.key ? "" : k.key))}
            className={cn(
              "h-9 rounded-md px-3 text-sm",
              kind === k.key ? "bg-primary text-white" : "bg-elevated text-muted-foreground",
            )}
          >
            {t(k.label)} · {kindCounts[k.key]}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">
          {rows.length === 1 ? t("netCount1") : t("netCount", { n: rows.length })}
        </span>
      </div>

      {geoErr ? <p className="mt-3 text-sm text-primary">{geoErr}</p> : null}
      {emptyCountry ? (
        <p className="mt-3 text-sm text-primary">{t("netEmptyCountry", { c: countryLabel })}</p>
      ) : null}

      {q.isError ? (
        <p className="mt-4 text-sm text-short">{t("netFail")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{q.isFetching ? t("netLoading") : t("netEmpty")}</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((ev) => (
            <EventCard key={ev.id} ev={ev} lang={lang} />
          ))}
        </div>
      )}
      <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="size-3.5" />
        {q.data?.sources?.length
          ? t("netSources", { s: q.data.sources.join(" · ") })
          : t("netPlatforms")}
      </p>
    </section>
  );
}
