import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Building2, MapPin, Orbit, Search, Users } from "lucide-react";
import type { Community, MerchantPlace } from "@/domain";
import type { CircularPin } from "@/domain/map-csv";
import { matchesQuery } from "@/domain/map-search";
import { searchMap } from "@/infrastructure/server-fns";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type SearchHit =
  | { kind: "community"; id: string; label: string; hint: string; lat: number; lon: number; community: Community }
  | { kind: "place"; id: string; label: string; hint: string; lat: number; lon: number; place: MerchantPlace }
  | { kind: "circular"; id: string; label: string; hint: string; lat: number; lon: number; circular: CircularPin }
  | { kind: "city"; id: string; label: string; hint: string; lat: number; lon: number };

const CITY_SEED: SearchHit[] = [
  { kind: "city", id: "city:mvd", label: "Montevideo", hint: "Uruguay", lat: -34.9011, lon: -56.1645 },
  { kind: "city", id: "city:bue", label: "Buenos Aires", hint: "Argentina", lat: -34.6037, lon: -58.3816 },
  { kind: "city", id: "city:sao", label: "São Paulo", hint: "Brasil", lat: -23.5505, lon: -46.6333 },
  { kind: "city", id: "city:scl", label: "Santiago", hint: "Chile", lat: -33.4489, lon: -70.6693 },
  { kind: "city", id: "city:bog", label: "Bogotá", hint: "Colombia", lat: 4.711, lon: -74.0721 },
  { kind: "city", id: "city:lim", label: "Lima", hint: "Perú", lat: -12.0464, lon: -77.0428 },
  { kind: "city", id: "city:mex", label: "Ciudad de México", hint: "México", lat: 19.4326, lon: -99.1332 },
  { kind: "city", id: "city:mad", label: "Madrid", hint: "España", lat: 40.4168, lon: -3.7038 },
  { kind: "city", id: "city:bcn", label: "Barcelona", hint: "España", lat: 41.3874, lon: 2.1686 },
  { kind: "city", id: "city:asun", label: "Asunción", hint: "Paraguay", lat: -25.2637, lon: -57.5759 },
];

function Highlight({ text, needle }: { text: string; needle: string }) {
  const n = needle.trim();
  if (!n) return <>{text}</>;
  const i = foldIndex(text, n);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary">{text.slice(i, i + n.length)}</span>
      {text.slice(i + n.length)}
    </>
  );
}

function foldIndex(text: string, needle: string) {
  const folded = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const n = needle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const i = folded.indexOf(n);
  if (i < 0) return -1;
  return text.length === folded.length ? i : text.toLowerCase().indexOf(needle.toLowerCase());
}

export function MapSearch({
  communities,
  places,
  circulars,
  onPick,
}: {
  communities: Community[];
  places: MerchantPlace[];
  circulars: CircularPin[];
  onPick: (hit: SearchHit) => void;
}) {
  const [q, setQ] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q")?.slice(0, 80) || "";
  });
  const fromUrl = useRef(q.length > 0);
  const pickedUrl = useRef(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [remote, setRemote] = useState<{
    places: MerchantPlace[];
    communities: Community[];
    cities: { label: string; lat: number; lon: number }[];
  }>({
    places: [],
    communities: [],
    cities: [],
  });
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();
  const needle = q.trim();
  const t = useT();

  const localHits = useMemo(() => {
    if (needle.length < 1) return [] as SearchHit[];
    const comms = communities
      .filter((c) => matchesQuery(needle, c.name, c.slug, c.description || ""))
      .slice(0, 5)
      .map(
        (c): SearchHit => ({
          kind: "community",
          id: c.id,
          label: c.name,
          hint: `@${c.slug}`,
          lat: c.lat,
          lon: c.lon,
          community: c,
        }),
      );
    const shops = places
      .filter((p) => matchesQuery(needle, p.name, p.category, p.address || "", p.description || ""))
      .filter((p) => !p.id.startsWith("cluster:"))
      .slice(0, 6)
      .map(
        (p): SearchHit => ({
          kind: "place",
          id: p.id,
          label: p.name,
          hint: p.category,
          lat: p.lat,
          lon: p.lon,
          place: p,
        }),
      );
    const circs = circulars
      .filter((c) => matchesQuery(needle, c.name, c.city, c.steward))
      .slice(0, 5)
      .map(
        (c): SearchHit => ({
          kind: "circular",
          id: c.id,
          label: c.name,
          hint: c.city,
          lat: c.lat,
          lon: c.lon,
          circular: c,
        }),
      );
    const cities = CITY_SEED.filter((c) => matchesQuery(needle, c.label, c.hint));
    return [...comms, ...shops, ...circs, ...cities];
  }, [needle, communities, places, circulars]);

  useEffect(() => {
    if (needle.length < 1) {
      setRemote({ places: [], communities: [], cities: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => {
      void searchMap({ data: { q: needle } })
        .then((r) => {
          setRemote(r);
          setLoading(false);
        })
        .catch(() => {
          setRemote({ places: [], communities: [], cities: [] });
          setLoading(false);
        });
    }, 200);
    return () => window.clearTimeout(t);
  }, [needle]);

  const hits = useMemo(() => {
    const seen = new Set(localHits.map((h) => h.id));
    const extraComms: SearchHit[] = (remote.communities || [])
      .filter((c) => !seen.has(c.id))
      .map((c) => {
        seen.add(c.id);
        return {
          kind: "community" as const,
          id: c.id,
          label: c.name,
          hint: `@${c.slug}`,
          lat: c.lat,
          lon: c.lon,
          community: c,
        };
      });
    const extraPlaces: SearchHit[] = remote.places
      .filter((p) => !seen.has(p.id) && !p.id.startsWith("cluster:"))
      .map((p) => {
        seen.add(p.id);
        return {
          kind: "place" as const,
          id: p.id,
          label: p.name,
          hint: p.category,
          lat: p.lat,
          lon: p.lon,
          place: p,
        };
      });
    const extraCities: SearchHit[] = remote.cities
      .filter((c) => !seen.has(`city:${c.lat.toFixed(3)}`))
      .map((c, i) => ({
        kind: "city" as const,
        id: `city:${c.lat},${c.lon},${i}`,
        label: c.label.split(",")[0] || c.label,
        hint: c.label,
        lat: c.lat,
        lon: c.lon,
      }));
    const take = (kind: SearchHit["kind"], extra: SearchHit[], n: number) =>
      [...localHits.filter((h) => h.kind === kind), ...extra].slice(0, n);
    return [...take("community", extraComms, 5), ...take("place", extraPlaces, 6), ...take("circular", [], 5), ...take("city", extraCities, 5)];
  }, [localHits, remote]);

  const groups = useMemo(() => {
    const g: { title: string; items: SearchHit[] }[] = [
      { title: t("grpComm"), items: hits.filter((h) => h.kind === "community") },
      { title: t("grpShop"), items: hits.filter((h) => h.kind === "place") },
      { title: t("grpCircular"), items: hits.filter((h) => h.kind === "circular") },
      { title: t("grpCity"), items: hits.filter((h) => h.kind === "city") },
    ];
    return g.filter((x) => x.items.length);
  }, [hits, t]);

  const flat = hits;

  useEffect(() => setActive(0), [hits.length, q]);

  useEffect(() => {
    if (!fromUrl.current || pickedUrl.current) return;
    const first = hits[0];
    if (!first) return;
    pickedUrl.current = true;
    onPick(first);
    setQ(first.label);
  }, [hits, onPick]);

  useEffect(() => {
    function onDoc(ev: MouseEvent) {
      if (!box.current?.contains(ev.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(hit: SearchHit) {
    onPick(hit);
    setQ(hit.label);
    setOpen(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = flat[active];
      if (hit) pick(hit);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const show = open && needle.length >= 1;
  let running = 0;

  return (
    <div ref={box} className="relative w-full">
      <label className="sr-only" htmlFor="mapa-buscar">
        {t("searchAria")}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        id="mapa-buscar"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && flat[active] ? `${listId}-${flat[active]!.id}` : undefined}
        className="h-11 w-full rounded-md bg-card pr-3 pl-10 text-base shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={t("searchPh")}
        value={q}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {show ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md bg-card py-1 shadow-[var(--shadow-border)]"
        >
          {flat.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{loading ? t("searching") : t("noHits")}</li>
          ) : (
            groups.map((group) => (
              <li key={group.title} className="block">
                <p className="px-3 pt-2 pb-1 text-xs tracking-wide text-muted-foreground uppercase">{group.title}</p>
                <ul>
                  {group.items.map((hit) => {
                    const i = running++;
                    const Icon = hit.kind === "community" ? Users : hit.kind === "city" ? MapPin : hit.kind === "circular" ? Orbit : Building2;
                    return (
                      <li key={hit.id} role="option" id={`${listId}-${hit.id}`} aria-selected={i === active}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-start gap-2 px-3 py-2 text-left text-sm",
                            i === active ? "bg-elevated" : "hover:bg-elevated",
                          )}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => pick(hit)}
                        >
                          <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">
                              <Highlight text={hit.label} needle={needle} />
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">{hit.hint}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
