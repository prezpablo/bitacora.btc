import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Building2, MapPin, Search, Users } from "lucide-react";
import type { Community, MerchantPlace } from "@/domain";
import { searchMap } from "@/infrastructure/server-fns";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type SearchHit =
  | { kind: "community"; id: string; label: string; hint: string; lat: number; lon: number; community: Community }
  | { kind: "place"; id: string; label: string; hint: string; lat: number; lon: number; place: MerchantPlace }
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

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function Highlight({ text, needle }: { text: string; needle: string }) {
  const n = needle.trim();
  if (!n) return <>{text}</>;
  const i = norm(text).indexOf(norm(n));
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary">{text.slice(i, i + n.length)}</span>
      {text.slice(i + n.length)}
    </>
  );
}

export function MapSearch({
  communities,
  places,
  onPick,
}: {
  communities: Community[];
  places: MerchantPlace[];
  onPick: (hit: SearchHit) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [remote, setRemote] = useState<{ places: MerchantPlace[]; cities: { label: string; lat: number; lon: number }[] }>({
    places: [],
    cities: [],
  });
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();
  const needle = q.trim();
  const nrm = norm(needle);
  const t = useT();

  const localHits = useMemo(() => {
    if (nrm.length < 1) return [] as SearchHit[];
    const comms = communities
      .filter((c) => norm(c.name).includes(nrm) || c.slug.includes(nrm))
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
      .filter((p) => norm(p.name).includes(nrm) || norm(p.category).includes(nrm))
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
    const cities = CITY_SEED.filter((c) => norm(c.label).includes(nrm) || norm(c.hint).includes(nrm));
    return [...comms, ...shops, ...cities];
  }, [nrm, communities, places]);

  useEffect(() => {
    if (needle.length < 1) {
      setRemote({ places: [], cities: [] });
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
          setRemote({ places: [], cities: [] });
          setLoading(false);
        });
    }, 200);
    return () => window.clearTimeout(t);
  }, [needle]);

  const hits = useMemo(() => {
    const seen = new Set(localHits.map((h) => h.id));
    const extraPlaces: SearchHit[] = remote.places
      .filter((p) => !seen.has(p.id))
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
    return [...localHits, ...extraPlaces, ...extraCities].slice(0, 14);
  }, [localHits, remote]);

  const groups = useMemo(() => {
    const g: { title: string; items: SearchHit[] }[] = [
      { title: t("grpComm"), items: hits.filter((h) => h.kind === "community") },
      { title: t("grpShop"), items: hits.filter((h) => h.kind === "place") },
      { title: t("grpCity"), items: hits.filter((h) => h.kind === "city") },
    ];
    return g.filter((x) => x.items.length);
  }, [hits, t]);

  const flat = hits;

  useEffect(() => setActive(0), [hits.length, q]);

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
        Autocompletar comercio, comunidad o ciudad
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
                    const Icon = hit.kind === "community" ? Users : hit.kind === "city" ? MapPin : Building2;
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
