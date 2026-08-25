import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Locate, Star, Users } from "lucide-react";
import type { Community, CommunityLink, GradeBand, MerchantLocal, MerchantPlace } from "@/domain";
import { canRemove, GRADE_HEX, gradeOf } from "@/domain";
import { getCityFrame, getMerchants } from "@/infrastructure/server-fns";
import { boxAround, locateBest, type CityFrame } from "@/infrastructure/geo";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CommunityFeedPanel } from "@/components/dashboard/community-feed";
import { SiteShell } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { MapSearch, type SearchHit } from "./map-search";

const STORE = "bitacora-places-v1";
const COMM = "bitacora-communities-v1";

function loadStore(): Record<string, MerchantLocal> {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "{}") as Record<string, MerchantLocal>;
  } catch {
    return {};
  }
}

function saveStore(data: Record<string, MerchantLocal>) {
  localStorage.setItem(STORE, JSON.stringify(data));
}

function loadCommunities(): Community[] {
  try {
    return JSON.parse(localStorage.getItem(COMM) || "[]") as Community[];
  } catch {
    return [];
  }
}

function saveCommunities(rows: Community[]) {
  localStorage.setItem(COMM, JSON.stringify(rows));
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

function safeUrl(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
}

type CommForm = {
  slug: string;
  name: string;
  description: string;
  logo: string;
  web: string;
  x: string;
  telegram: string;
  instagram: string;
  nostr: string;
};

const EMPTY_FORM: CommForm = {
  slug: "",
  name: "",
  description: "",
  logo: "",
  web: "",
  x: "",
  telegram: "",
  instagram: "",
  nostr: "",
};

function linksFromForm(f: CommForm): CommunityLink[] {
  const rows: CommunityLink[] = [];
  const web = safeUrl(f.web);
  if (web) rows.push({ label: "Link / bio", url: web });
  const x = safeUrl(f.x.startsWith("http") || f.x.includes(".") ? f.x : f.x ? `https://x.com/${f.x.replace(/^@/, "")}` : "");
  if (x) rows.push({ label: "X", url: x });
  const tg = safeUrl(
    f.telegram.startsWith("http") || f.telegram.includes(".")
      ? f.telegram
      : f.telegram
        ? `https://t.me/${f.telegram.replace(/^@/, "")}`
        : "",
  );
  if (tg) rows.push({ label: "Telegram", url: tg });
  const ig = safeUrl(
    f.instagram.startsWith("http") || f.instagram.includes(".")
      ? f.instagram
      : f.instagram
        ? `https://instagram.com/${f.instagram.replace(/^@/, "")}`
        : "",
  );
  if (ig) rows.push({ label: "Instagram", url: ig });
  const n = f.nostr.trim();
  if (n) rows.push({ label: "Nostr", url: n.startsWith("http") ? safeUrl(n) : `https://njump.me/${n.replace(/^nostr:/, "")}` });
  return rows.filter((l) => l.url);
}

function applyFix(
  L: typeof import("leaflet"),
  map: import("leaflet").Map,
  here: import("leaflet").LayerGroup | null,
  lat: number,
  lon: number,
  accuracy: number,
  city: CityFrame,
) {
  if (here) {
    here.clearLayers();
    L.circle([lat, lon], {
      radius: Math.min(Math.max(accuracy, 80), 8000),
      color: "#f7931a",
      weight: 1,
      fillColor: "#f7931a",
      fillOpacity: 0.12,
    }).addTo(here);
    L.circleMarker([lat, lon], {
      radius: 9,
      color: "#fff",
      weight: 2,
      fillColor: "#f7931a",
      fillOpacity: 1,
    }).addTo(here);
  }
  const bounds = L.latLngBounds([city.south, city.west], [city.north, city.east]);
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13, animate: true });
  } else {
    map.setView([city.lat, city.lon], 13, { animate: true });
  }
}

export function SpendMap() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const marks = useRef<import("leaflet").LayerGroup | null>(null);
  const hitMark = useRef<import("leaflet").Layer | null>(null);
  const userMark = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [geo, setGeo] = useState<"idle" | "wait" | "ok" | "denied">("idle");
  const [hit, setHit] = useState<SearchHit | null>(null);
  const [bbox, setBbox] = useState({ west: -56.35, south: -35.05, east: -55.95, north: -34.72 });
  const [store, setStore] = useState<Record<string, MerchantLocal>>({});
  const [comms, setComms] = useState<Community[]>([]);
  const [sel, setSel] = useState<MerchantPlace | null>(null);
  const [selComm, setSelComm] = useState<Community | null>(null);
  const [draft, setDraft] = useState("");
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [nick, setNick] = useState("colaborador");
  const [filter, setFilter] = useState<GradeBand | "todas" | "comunidades">("todas");
  const [drop, setDrop] = useState<{ lat: number; lon: number } | null>(null);
  const [mode, setMode] = useState<"comercio" | "comunidad">("comercio");
  const [form, setForm] = useState<CommForm>(EMPTY_FORM);
  const [formErr, setFormErr] = useState("");

  useEffect(() => {
    setStore(loadStore());
    setComms(loadCommunities());
    setNick(localStorage.getItem("bitacora-nick") || "colaborador");
  }, []);

  const query = useQuery({
    queryKey: ["merchants", bbox.west.toFixed(3), bbox.south.toFixed(3), bbox.east.toFixed(3), bbox.north.toFixed(3)],
    queryFn: () => getMerchants({ data: bbox }),
    staleTime: 60_000,
  });

  const places = useMemo(() => {
    if (filter === "comunidades") return [];
    const rows = (query.data ?? []).filter((p) => !store[p.id]?.removed);
    if (filter === "todas") return rows;
    return rows.filter((p) => gradeOf(store[p.id], Date.now()).band === filter);
  }, [query.data, store, filter]);

  const visibleComms = useMemo(() => {
    if (filter !== "todas" && filter !== "comunidades") return [];
    return comms.filter((c) => c.lon >= bbox.west && c.lon <= bbox.east && c.lat >= bbox.south && c.lat <= bbox.north);
  }, [comms, bbox, filter]);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let dead = false;
    let map: import("leaflet").Map | null = null;
    void import("leaflet").then((L) => {
      if (dead || !mapEl.current || mapRef.current) return;
      map = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView([20, -40], 3);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://btcmap.org">BTC Map</a>',
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      leafletRef.current = L;
      const group = L.layerGroup().addTo(map);
      userMark.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      marks.current = group;
      const pushBbox = () => {
        if (!map) return;
        const b = map.getBounds();
        setBbox({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
      };
      map.on("moveend", pushBbox);
      map.on("click", (ev: { latlng: { lat: number; lng: number } }) => {
        setDrop({ lat: ev.latlng.lat, lon: ev.latlng.lng });
        setSel(null);
        setSelComm(null);
        setHit(null);
      });
      requestAnimationFrame(() => map?.invalidateSize());
      pushBbox();
      void locateBest(false, (lat, lon) => getCityFrame({ data: { lat, lon } }).catch(() => boxAround(lat, lon)))
        .then(({ fix, city }) => {
          if (dead || !mapRef.current || !leafletRef.current) return;
          applyFix(leafletRef.current, mapRef.current, userMark.current, fix.lat, fix.lon, fix.accuracy, city);
          mapRef.current.invalidateSize();
          setGeo("ok");
        })
        .catch(() => setGeo("denied"));
    });
    return () => {
      dead = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        marks.current = null;
        userMark.current = null;
        leafletRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = marks.current;
    if (!map || !group) return;
    void import("leaflet").then((L) => {
      group.clearLayers();
      for (const p of places) {
        const g = gradeOf(store[p.id], Date.now());
        const color = GRADE_HEX[g.band];
        const m = L.circleMarker([p.lat, p.lon], {
          radius: hit && hit.kind === "place" && hit.id === p.id ? 14 : 9,
          color,
          fillColor: color,
          fillOpacity: 0.92,
          weight: hit && hit.kind === "place" && hit.id === p.id ? 4 : 2,
        });
        m.on("click", (ev) => {
          L.DomEvent.stopPropagation(ev);
          setSel(p);
          setSelComm(null);
          setDrop(null);
          setDraft(store[p.id]?.description || "");
        });
        m.bindTooltip(p.name, { direction: "top", sticky: true });
        m.addTo(group);
      }
      for (const c of visibleComms) {
        const img = c.logo
          ? `<img src="${c.logo.replace(/"/g, "")}" alt="" width="28" height="28" style="width:28px;height:28px;border-radius:50%;object-fit:cover;display:block" />`
          : `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;color:#fff;font-weight:700">₿</span>`;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:36px;height:36px;border-radius:50%;background:#f7931a;border:2px solid #fff;box-shadow:0 0 0 1px #e6e6e6;overflow:hidden;display:flex;align-items:center;justify-content:center">${img}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const m = L.marker([c.lat, c.lon], { icon });
        m.on("click", (ev) => {
          L.DomEvent.stopPropagation(ev);
          setSelComm(c);
          setSel(null);
          setDrop(null);
        });
        const tip = `<div style="display:flex;gap:8px;align-items:center;min-width:140px">
          ${c.logo ? `<img src="${c.logo.replace(/"/g, "")}" alt="" width="32" height="32" style="border-radius:50%;object-fit:cover" />` : ""}
          <div><strong>${c.name.replace(/</g, "")}</strong><br/><span style="opacity:.7">@${c.slug.replace(/</g, "")}</span></div>
        </div>`;
        m.bindTooltip(tip, { direction: "top", sticky: true, opacity: 1 });
        m.addTo(group);
      }
    });
  }, [places, store, visibleComms, hit]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    void import("leaflet").then((L) => {
      if (hitMark.current) {
        map.removeLayer(hitMark.current);
        hitMark.current = null;
      }
      if (!hit) return;
      const glyph = hit.kind === "community" ? "₿" : hit.kind === "city" ? "●" : "₿";
      const icon = L.divIcon({
        className: "",
        html: `<div class="bitacora-hit" role="img" aria-label="${hit.label.replace(/"/g, "")}">
          <span class="bitacora-hit-pulse"></span>
          <span class="bitacora-hit-head">${glyph}</span>
          <span class="bitacora-hit-point"></span>
        </div>`,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
      });
      const marker = L.marker([hit.lat, hit.lon], { icon, zIndexOffset: 800, interactive: false });
      marker.bindPopup(`<strong>${hit.label.replace(/</g, "")}</strong><br/><span>${hit.hint.replace(/</g, "")}</span>`, {
        closeButton: false,
        offset: [0, -36],
      });
      marker.addTo(map);
      marker.openPopup();
      hitMark.current = marker;
    });
  }, [hit]);

  async function goToUser(preferGps: boolean) {
    setGeo("wait");
    try {
      const { fix, city } = await locateBest(preferGps, (lat, lon) =>
        getCityFrame({ data: { lat, lon } }).catch(() => boxAround(lat, lon)),
      );
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;
      applyFix(L, map, userMark.current, fix.lat, fix.lon, fix.accuracy, city);
      map.invalidateSize();
      setGeo("ok");
    } catch {
      setGeo("denied");
    }
  }

  function flyTo(hit: SearchHit) {
    setHit(hit);
    mapRef.current?.setView([hit.lat, hit.lon], hit.kind === "city" ? 13 : 16, { animate: true });
    setDrop(null);
    if (hit.kind === "community") {
      setSelComm(hit.community);
      setSel(null);
    } else if (hit.kind === "place") {
      setSel(hit.place);
      setSelComm(null);
      setDraft(store[hit.place.id]?.description || "");
    } else {
      setSel(null);
      setSelComm(null);
    }
  }

  function commit(id: string, next: MerchantLocal) {
    const data = { ...store, [id]: next };
    setStore(data);
    saveStore(data);
  }

  function vote(place: MerchantPlace) {
    const prev = store[place.id] ?? { description: "", votes: [], listedAt: place.createdAt };
    const by = nick.trim() || "colaborador";
    localStorage.setItem("bitacora-nick", by);
    const votes = [...prev.votes.filter((v) => v.by !== by), { stars, at: Date.now(), by }];
    commit(place.id, {
      ...prev,
      description: draft.trim() || prev.description,
      votes,
      listedAt: prev.listedAt || place.createdAt,
    });
  }

  function propose() {
    if (!drop || !draft.trim()) return;
    const id = `local:${drop.lat.toFixed(5)},${drop.lon.toFixed(5)}`;
    const place: MerchantPlace = {
      id,
      lat: drop.lat,
      lon: drop.lon,
      name: draft.trim().slice(0, 80),
      category: "propuesta",
      createdAt: Date.now(),
    };
    commit(id, {
      description: draft.trim(),
      votes: [{ stars, at: Date.now(), by: nick.trim() || "colaborador" }],
      listedAt: Date.now(),
    });
    setSel(place);
    setDrop(null);
  }

  function onLogoFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 400_000) {
      setFormErr("El logo debe pesar menos de 400 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  function saveCommunity() {
    if (!drop) return;
    const slug = slugify(form.slug || form.name);
    if (!slug) {
      setFormErr("Necesitás un identificador (ej. bitcoin-mvd).");
      return;
    }
    if (comms.some((c) => c.slug === slug)) {
      setFormErr("Ese identificador ya existe.");
      return;
    }
    const row: Community = {
      id: `c:${slug}`,
      slug,
      name: form.name.trim() || slug,
      lat: drop.lat,
      lon: drop.lon,
      logo: form.logo,
      description: form.description.trim(),
      links: linksFromForm(form),
      createdAt: Date.now(),
    };
    const next = [...comms, row];
    setComms(next);
    saveCommunities(next);
    setSelComm(row);
    setDrop(null);
    setForm(EMPTY_FORM);
    setFormErr("");
  }

  const local = sel ? store[sel.id] : undefined;
  const g = sel ? gradeOf(local, Date.now()) : null;
  const removable = sel ? canRemove(local) : false;
  const t = useT();
  const chips: (GradeBand | "todas" | "comunidades")[] = ["todas", "comunidades", "alta", "media", "baja", "nueva"];

  return (
    <SiteShell>
      <section className="space-y-3">
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {t("mapTitle")}
        </h1>
        <p className="text-base text-pretty text-muted-foreground">{t("mapLead")}</p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "h-8 rounded-md px-3 font-mono text-xs",
                filter === k ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground",
              )}
            >
              {k === "todas"
                ? t("all")
                : k === "comunidades"
                  ? t("communities")
                  : k === "alta"
                    ? t("gradeHigh")
                    : k === "media"
                      ? t("gradeMid")
                      : k === "baja"
                        ? t("gradeLow")
                        : t("gradeNew")}
            </button>
          ))}
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[420px] lg:min-h-[560px]">
          <div className="absolute top-3 right-3 left-3 z-[1500] max-w-lg">
            <MapSearch communities={comms} places={places} onPick={flyTo} />
          </div>
          <div
            ref={mapEl}
            className="h-full min-h-[420px] overflow-hidden rounded-lg shadow-[var(--shadow-border)] lg:min-h-[560px]"
          />
          <div className="pointer-events-none absolute bottom-4 left-3 z-[2000]">
            {geo === "wait" || geo === "denied" ? (
              <p className="mb-2 rounded-md bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-[var(--shadow-border)]">
                {geo === "wait" ? t("geoWait") : t("geoDenied")}
              </p>
            ) : null}
            <button
              type="button"
              className="pointer-events-auto inline-flex size-11 items-center justify-center rounded-md bg-primary text-white shadow-md"
              aria-label={t("geoAsk")}
              title={t("geoAsk")}
              onClick={(ev) => {
                ev.stopPropagation();
                void goToUser(true);
              }}
            >
              <Locate className="size-5 text-white" strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <aside className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)]">
          {selComm ? (
            <CommunityCard community={selComm} />
          ) : sel ? (
            <div className="space-y-3">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{sel.category}</p>
              <h3 className="text-lg font-medium text-foreground">{sel.name}</h3>
              {g ? (
                <p className="text-sm" style={{ color: GRADE_HEX[g.band] }}>
                  {g.band === "baja"
                    ? t("gradeLow")
                    : g.band === "media"
                      ? t("gradeMid")
                      : g.band === "alta"
                        ? t("gradeHigh")
                        : t("gradeNew")}
                  {g.avg != null ? ` · ${g.avg.toFixed(1)}/5` : ""} · {g.count} nota{g.count === 1 ? "" : "s"}
                  {g.monthly ? " (mes)" : ""}
                </p>
              ) : null}
              {local?.description ? <p className="text-sm text-pretty text-foreground">{local.description}</p> : null}
              <label className="block text-sm">
                Tu nombre
                <input
                  className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Descripción
                <textarea
                  className="mt-1 min-h-20 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Cómo se paga, Lightning, horario…"
                />
              </label>
              <div className="flex gap-1" role="group" aria-label="Calificación">
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-md",
                      n <= stars ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-label={`${n} estrellas`}
                  >
                    <Star className="size-5" fill={n <= stars ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <Button className="w-full" onClick={() => vote(sel)}>
                Publicar colaboración
              </Button>
              {removable ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => commit(sel.id, { ...(local as MerchantLocal), removed: true })}
                >
                  Quitar por baja calificación
                </Button>
              ) : null}
            </div>
          ) : drop ? (
            <div className="space-y-3">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Nuevo punto</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  className={cn("h-8 rounded-md px-3 text-xs", mode === "comercio" ? "bg-primary text-white" : "bg-elevated")}
                  onClick={() => setMode("comercio")}
                >
                  Comercio
                </button>
                <button
                  type="button"
                  className={cn("h-8 rounded-md px-3 text-xs", mode === "comunidad" ? "bg-primary text-white" : "bg-elevated")}
                  onClick={() => setMode("comunidad")}
                >
                  Comunidad
                </button>
              </div>
              {mode === "comercio" ? (
                <>
                  <textarea
                    className="min-h-20 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Nombre y cómo se paga…"
                  />
                  <Button className="w-full" onClick={propose}>
                    Proponer comercio
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <input
                    className="h-10 w-full rounded-md bg-elevated px-3 text-sm"
                    placeholder="Nombre"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    className="h-10 w-full rounded-md bg-elevated px-3 text-sm"
                    placeholder="Identificador (bitcoin-mvd)"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                  <textarea
                    className="min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm"
                    placeholder="Descripción"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <input type="file" accept="image/*" onChange={(e) => onLogoFile(e.target.files?.[0])} />
                  <input
                    className="h-10 w-full rounded-md bg-elevated px-3 text-sm"
                    placeholder="Link / bio"
                    value={form.web}
                    onChange={(e) => setForm((f) => ({ ...f, web: e.target.value }))}
                  />
                  <input
                    className="h-10 w-full rounded-md bg-elevated px-3 text-sm"
                    placeholder="X"
                    value={form.x}
                    onChange={(e) => setForm((f) => ({ ...f, x: e.target.value }))}
                  />
                  {formErr ? <p className="text-sm text-short">{formErr}</p> : null}
                  <Button className="w-full" onClick={saveCommunity}>
                    Publicar comunidad
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Elegí un punto o tocá el mapa para agregar uno.</p>
          )}
        </aside>
      </div>

      <section className="mt-4">
        <CommunityFeedPanel />
      </section>
    </SiteShell>
  );
}

function CommunityCard({ community }: { community: Community }) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1 text-xs tracking-wide text-muted-foreground uppercase">
        <Users className="size-3.5" />
        Comunidad
      </p>
      <div className="flex items-center gap-3">
        {community.logo ? (
          <img src={community.logo} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            ₿
          </span>
        )}
        <div>
          <h3 className="text-lg font-medium">{community.name}</h3>
          <p className="font-mono text-xs text-muted-foreground">@{community.slug}</p>
        </div>
      </div>
      {community.description ? <p className="text-sm text-pretty">{community.description}</p> : null}
      <ul className="space-y-1">
        {community.links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary">
              <ExternalLink className="size-3.5" />
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
