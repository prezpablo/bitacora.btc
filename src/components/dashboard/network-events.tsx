import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Locate, MapPin } from "lucide-react";
import type { ContinentId, EventBoardQuery, EventKind, NetworkEvent } from "@/domain";
import { EVENT_PAGE, EVENT_PAGE_MOBILE, eventFlyerSrc } from "@/domain";
import { continentOf, eventQueryFromSearch } from "@/domain";
import { pinDeskScroll } from "@/lib/desk-scroll";
import { getCityFrame } from "@/infrastructure/server-fns";
import { prefetchEventPage, useMapEvents } from "@/lib/map-query";
import { locateBest } from "@/infrastructure/geo";
import { countryName as namedCountry, localeTag } from "@/lib/display";
import { type AppLang } from "@/lib/locale";
import { useAppLang, useT, type CopyKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StaleStamp } from "./stale-stamp";
import { useQueryClient } from "@tanstack/react-query";

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
  const [imgFail, setImgFail] = useState(false);
  useEffect(() => {
    setImgFail(false);
  }, [ev.image]);
  const online = ev.kind === "online";
  const place = online
    ? t("netKindOnline")
    : [ev.city || ev.region, namedCountry(ev.countryCode, lang, ev.country)].filter(Boolean).join(", ");
  const utc = fmtRange(ev.startAt, ev.endAt, "UTC", lang);
  const local = fmtRange(ev.startAt, ev.endAt, undefined, lang);
  const eventTz = fmtRange(ev.startAt, ev.endAt, ev.timezone, lang);
  return (
    <article className="flex flex-col overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-plot">
        {ev.image && !imgFail ? (
          <img
            src={eventFlyerSrc(ev.image)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center center" }}
            loading="lazy"
            decoding="async"
            width={960}
            height={720}
            onError={(e) => {
              const el = e.currentTarget;
              const orig = ev.image;
              if (orig && el.dataset.tried !== "1") {
                el.dataset.tried = "1";
                el.src = orig;
                return;
              }
              setImgFail(true);
            }}
          />
        ) : (
          <span className="flex size-full items-center justify-center text-2xl text-primary sm:text-3xl">₿</span>
        )}
        <span className="absolute top-1 left-1 rounded-md bg-primary px-1 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase sm:top-1.5 sm:left-1.5 sm:px-1.5 sm:text-[10px]">
          {ev.platform}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-1.5 sm:gap-1.5 sm:p-2.5">
        <h3 className="line-clamp-2 text-[11px] font-medium text-pretty text-foreground sm:text-sm">{ev.title}</h3>
        {ev.description ? <p className="hidden line-clamp-2 text-xs text-pretty text-muted-foreground sm:block">{ev.description}</p> : null}
        <ul className="mt-auto space-y-0.5 font-mono text-[10px] text-muted-foreground sm:text-[11px]">
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
          className="mt-1 inline-flex h-7 items-center justify-center rounded-md bg-primary text-[11px] font-medium text-white no-underline sm:h-8 sm:text-xs"
        >
          {t("netEnter")}
        </a>
      </div>
    </article>
  );
}

const selectClass =
  "chip chip-idle shrink-0 disabled:opacity-40";

const chipOn = "chip chip-on";
const chipIdle = "chip chip-idle";

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
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        className={cn(selectClass, (continent || country) && "chip-on", "max-w-[10rem] gap-1 sm:max-w-none sm:min-w-40")}
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
                  continent === g.key && !country ? "bg-primary text-white" : "text-foreground hover:bg-elevated",
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

function useEventPageSize() {
  const [size, setSize] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 39.99rem)").matches
      ? EVENT_PAGE_MOBILE
      : EVENT_PAGE,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 39.99rem)");
    const apply = () => setSize(mq.matches ? EVENT_PAGE_MOBILE : EVENT_PAGE);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return size;
}

export function NetworkEvents() {
  const t = useT();
  const lang = useAppLang();
  const qc = useQueryClient();
  const boot = typeof window === "undefined" ? {} : eventQueryFromSearch(window.location.search);
  const [country, setCountry] = useState(boot.country || "");
  const [continent, setContinent] = useState<ContinentId | "">(boot.continent || "");
  const [platform, setPlatform] = useState(boot.platform || "");
  const [kind, setKind] = useState<EventKind | "">(boot.kind || "");
  const [near, setNear] = useState(false);
  const [countryName, setCountryName] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState("");
  const [dateDir, setDateDir] = useState<"asc" | "desc">(boot.dir === "desc" ? "desc" : "asc");
  const [page, setPage] = useState(boot.page || 1);
  const pageSize = useEventPageSize();

  const query: EventBoardQuery = {
    page,
    size: pageSize,
    dir: dateDir,
    continent,
    country,
    countryName,
    platform,
    kind,
  };
  const q = useMapEvents(query);
  const board = q.data;
  const rows = board?.events ?? [];
  const total = board?.total ?? 0;
  const pages = board?.pages ?? 1;
  const pageNow = board?.page ?? page;
  const facets = board?.facets;
  const kindCounts = facets?.kinds ?? {};
  const platforms = facets?.platforms ?? [];
  const emptyCountry = Boolean(country) && total === 0 && (facets?.live ?? 0) > 0;

  const countriesByContinent = useMemo(() => {
    const map = new Map<ContinentId, Map<string, string>>();
    for (const c of facets?.countries ?? []) {
      let inner = map.get(c.continent);
      if (!inner) {
        inner = new Map();
        map.set(c.continent, inner);
      }
      inner.set(c.code, namedCountry(c.code, lang, c.name));
    }
    return CONTINENTS.map((c) => {
      const inner = map.get(c.key);
      const list = inner
        ? [...inner.entries()].sort((a, b) => a[1].localeCompare(b[1], lang))
        : [];
      return { ...c, countries: list };
    });
  }, [facets?.countries, lang]);

  const countryLabel = country
    ? namedCountry(
        country,
        lang,
        countriesByContinent.flatMap((g) => g.countries).find(([c]) => c === country)?.[1] ||
          countryName ||
          country,
      )
    : "";

  const skipPageReset = useRef(true);

  useEffect(() => {
    if (skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }
    setPage(1);
  }, [country, continent, platform, kind, near, dateDir, pageSize]);

  useEffect(() => pinDeskScroll(), [country, continent, platform, kind, near, dateDir, page, q.isFetching]);

  useEffect(() => {
    if (q.isFetching || !board) return;
    if (board.page !== page) setPage(board.page);
  }, [board, page, q.isFetching]);

  useEffect(() => {
    if (!board || pageNow >= pages) return;
    void prefetchEventPage(qc, { ...query, page: pageNow + 1 });
  }, [pageNow, pages, dateDir, kind, platform, country, continent, countryName]);

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

  const dirty = Boolean(country || kind || near || continent || platform || dateDir !== "asc");

  return (
    <section className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-2xl font-medium tracking-tight text-foreground">
          <Calendar className="size-5 text-primary" aria-hidden />
          {t("netTitle")}
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">{t("netLead")}</p>
        <StaleStamp asOf={q.data?.asOf} />
      </div>

      <div className="relative z-[2] chip-row mt-3">
        <button
          type="button"
          className={cn(near ? chipOn : chipIdle)}
          onClick={() => void nearYou()}
          disabled={locating}
          aria-pressed={near}
        >
          <Locate />
          {locating ? t("geoWait") : near ? t("netNearOn", { c: countryLabel || country }) : t("netNear")}
        </button>
        {(platforms.length ? platforms : platform ? [[platform, 0] as [string, number]] : []).map(([name, n]) => {
          const on = !platform || platform === name;
          return (
          <button
            key={name}
            type="button"
            className={cn(on ? chipOn : chipIdle)}
            onClick={() => setPlatform((cur) => (cur === name ? "" : name))}
            aria-pressed={on}
          >
            {name}
            <span className="font-mono tabular-nums">{n}</span>
          </button>
          );
        })}
        <select
          className={selectClass}
          value={dateDir}
          onChange={(e) => setDateDir(e.target.value === "desc" ? "desc" : "asc")}
          aria-label={t("netDate")}
        >
          <option value="asc">{t("netSoon")}</option>
          <option value="desc">{t("netLate")}</option>
        </select>
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
          <button type="button" className={chipIdle} onClick={() => {
            setCountry("");
            setKind("");
            setContinent("");
            setPlatform("");
            setNear(false);
            setCountryName("");
            setGeoErr("");
            setDateDir("asc");
            setPage(1);
          }}>
            {t("netClear")}
          </button>
        ) : null}
      </div>

      <div className="relative z-[2] chip-row mt-2">
        {KIND_COPY.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKind((cur) => (cur === k.key ? "" : k.key))}
            className={cn(kind === k.key ? chipOn : chipIdle, !(kindCounts[k.key] || 0) && kind !== k.key && "opacity-50")}
            aria-pressed={kind === k.key}
          >
            {t(k.label)} · {kindCounts[k.key] || 0}
          </button>
        ))}
        <span className="chip flex-none text-muted-foreground shadow-none">
          {total === 1 ? t("netCount1") : t("netCount", { n: total })}
        </span>
      </div>

      {geoErr ? <p className="mt-3 text-sm text-primary">{geoErr}</p> : null}
      {emptyCountry ? (
        <p className="mt-3 text-sm text-primary">{t("netEmptyCountry", { c: countryLabel })}</p>
      ) : null}

      {q.isError ? (
        <p className="mt-4 text-sm text-short">{t("netFail")}</p>
      ) : (
        <div className="relative mt-4 min-h-[28rem]" aria-busy={q.isFetching || undefined}>
          {rows.length ? (
            <div className={cn("grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2", q.isFetching && "opacity-40")}>
              {rows.map((ev) => (
                <EventCard key={ev.id} ev={ev} lang={lang} />
              ))}
            </div>
          ) : !q.isFetching ? (
            <p className="text-sm text-muted-foreground">{t("netEmpty")}</p>
          ) : null}
          {q.isFetching ? (
            <div className="absolute inset-0 z-[1] flex items-center justify-center bg-card/40">
              <span className="bit-spin text-4xl" aria-hidden>
                ₿
              </span>
              <span className="sr-only">{t("netLoading")}</span>
            </div>
          ) : null}
          {pages > 1 && rows.length ? (
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={pageNow <= 1 || q.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                {t("netPrev")}
              </Button>
              <span className="font-mono text-xs text-muted-foreground">
                {t("netPageOf", { p: pageNow, n: pages })}
              </span>
              <Button
                type="button"
                size="sm"
                className="gap-1"
                disabled={pageNow >= pages || q.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("netNext")}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}
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
