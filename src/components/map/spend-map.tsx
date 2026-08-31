import { useEffect, useMemo, useRef, useState } from "react";
import { Locate, Star, Users } from "lucide-react";
import type { Community, GradeBand, MerchantLocal, MerchantPlace } from "@/domain";
import type { GlobeFocus } from "@/domain/globe";
import { FOUNDING_UY } from "@/domain/globe";
import { addScore, canRemove, dumpMapCsv, GRADE_HEX, gradeOf, communityTrust, listingTrust, logoUrl, parseMapCsv, rowToCommunity, rowToLocal } from "@/domain";
import { dedupeCommunities, layoutCityLogos } from "@/domain/community-dedupe";
import { makePinToken } from "@/domain/community-pins";
import { LogoPicker } from "./logo-picker";
import { VERIFIED_STAR_HTML, VerifiedStar } from "./verified-star";
import { linksFromPicked, type SocialKey } from "@/domain/socials";
import { getCityFrame, saveMapCsv, verifyMapListing } from "@/infrastructure/server-fns";
import { localeTag } from "@/lib/display";
import { countryFromGlobe, useGlobeStats, useMapCommunities, useMapCsv, useMapMerchants, useMapStore } from "@/lib/map-query";
import { boxAround, locateBest, type CityFrame } from "@/infrastructure/geo";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { extrasAllowed, readExtra, writeExtra } from "@/lib/storage-consent";
import { CommunityFeedPanel } from "@/components/dashboard/community-feed";
import { BitcoinMark, BITCOIN_MARK_SVG } from "@/components/dashboard/brand-mark";
import { SiteShell } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { MapSearch, type SearchHit } from "./map-search";
import { EMPTY_HOURS, type WeekHours } from "@/domain/hours";
import type { PayKey } from "@/domain/pays";
import { HoursEditor, HoursView } from "./hours-editor";
import { CaptchaBox } from "./captcha";
import { PayPicker, PayRow } from "./pay-row";
import { AddressSearch } from "./address-search";
import { SocialPicker, SocialRow } from "./social-row";
import { addressIssues, formatStreet, type StreetHit } from "@/infrastructure/address";
import {
  firebaseConfigured,
  listenCommunities,
  listenPlaces,
  mergeCommunities,
  mergeStores,
  upsertCommunity,
  upsertPlace,
} from "@/infrastructure/map-sync";

const STORE = "bitacora-places-v1";
const COMM = "bitacora-communities-v1";

function loadStore(): Record<string, MerchantLocal> {
  try {
    return JSON.parse(readExtra(STORE, "{}")) as Record<string, MerchantLocal>;
  } catch {
    return {};
  }
}

function saveStore(data: Record<string, MerchantLocal>) {
  writeExtra(STORE, JSON.stringify(data));
}

function loadCommunities(): Community[] {
  try {
    return JSON.parse(readExtra(COMM, "[]")) as Community[];
  } catch {
    return [];
  }
}

function saveCommunities(rows: Community[]) {
  writeExtra(COMM, JSON.stringify(rows));
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

type CommForm = {
  slug: string;
  name: string;
  description: string;
  logo: string;
};

const EMPTY_FORM: CommForm = {
  slug: "",
  name: "",
  description: "",
  logo: "",
};

const CSV_CACHE = "bitacora-map-csv-v1";

function applyCsv(text: string) {
  const rows = parseMapCsv(text);
  const store: Record<string, MerchantLocal> = {};
  const comms: Community[] = [];
  for (const r of rows) {
    if (r.tipo === "community") comms.push(rowToCommunity(r));
    else store[r.id] = rowToLocal(r);
  }
  return { store, comms };
}

function StarMeter({ score, votes }: { score: number; votes: number }) {
  const avg = votes > 0 ? score : 0;
  const pct = Math.max(0, Math.min(100, (avg / 5) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex">
        <div className="flex text-muted-foreground">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="size-5" />
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <div className="flex text-primary">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className="size-5" fill="currentColor" />
            ))}
          </div>
        </div>
      </div>
      <span className="font-mono text-sm text-foreground">
        {avg.toFixed(1)} · {votes}
      </span>
    </div>
  );
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
  if (accuracy < 4000) {
    const z = accuracy < 150 ? 16 : accuracy < 600 ? 15 : 14;
    map.setView([lat, lon], z, { animate: true });
  } else if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13, animate: true });
  } else {
    map.setView([city.lat, city.lon], 13, { animate: true });
  }
}

export function SpendMap({ focus, onWorld, embedded = false }: { focus?: GlobeFocus; onWorld?: () => void; embedded?: boolean }) {
  const t = useT();
  const lang = useLocale((s) => s.lang);
  const { invalidate } = useMapStore();
  const onWorldRef = useRef(onWorld);
  onWorldRef.current = onWorld;
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
  const [shopName, setShopName] = useState("");
  const [shopDesc, setShopDesc] = useState("");
  const [shopNotes, setShopNotes] = useState("");
  const [shopHours, setShopHours] = useState<WeekHours>(EMPTY_HOURS);
  const [shopPays, setShopPays] = useState<PayKey[]>([]);
  const [shopAddr, setShopAddr] = useState("");
  const [addrHit, setAddrHit] = useState<StreetHit | null>(null);
  const [shopLogo, setShopLogo] = useState("");
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [nick, setNick] = useState("colaborador");
  const [filter, setFilter] = useState<GradeBand | "todas" | "comunidades">("todas");
  const [drop, setDrop] = useState<{ lat: number; lon: number } | null>(null);
  const [mode, setMode] = useState<"comercio" | "comunidad">("comercio");
  const [form, setForm] = useState<CommForm>(EMPTY_FORM);
  const [formErr, setFormErr] = useState("");
  const [picked, setPicked] = useState<SocialKey[]>([]);
  const [handles, setHandles] = useState<Partial<Record<SocialKey, string>>>({});
  const [captchaOk, setCaptchaOk] = useState(false);
  const [sync, setSync] = useState<"off" | "wait" | "on" | "fail">(firebaseConfigured() ? "wait" : "off");

  useEffect(() => {
    setNick(readExtra("bitacora-nick", "colaborador"));
    const cached = extrasAllowed() ? readExtra(CSV_CACHE, "") : "";
    if (cached) {
      const next = applyCsv(cached);
      setStore(next.store);
      setComms(next.comms);
    } else {
      setStore(loadStore());
      setComms(loadCommunities());
    }
  }, []);

  const csvQ = useMapCsv();
  useEffect(() => {
    const text = csvQ.data;
    if (!text?.includes("id,tipo")) return;
    const next = applyCsv(text);
    setStore((prev) => ({ ...prev, ...next.store }));
    setComms((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      for (const c of next.comms) map.set(c.id, c);
      return [...map.values()];
    });
    writeExtra(CSV_CACHE, text);
    setSync("on");
  }, [csvQ.data]);

  useEffect(() => {
    if (!firebaseConfigured()) {
      setSync("off");
      return;
    }
    setSync("wait");
    const stopPlaces = listenPlaces((remote) => {
      setStore((prev) => {
        const next = mergeStores(prev, remote);
        saveStore(next);
        return next;
      });
      setSync("on");
    });
    const stopComms = listenCommunities((remote) => {
      setComms((prev) => {
        const next = mergeCommunities(prev, remote);
        saveCommunities(next);
        return next;
      });
      setSync("on");
    });
    const t = window.setTimeout(() => {
      setSync((s) => (s === "wait" ? "fail" : s));
    }, 12_000);
    return () => {
      stopPlaces();
      stopComms();
      window.clearTimeout(t);
    };
  }, []);

  const query = useMapMerchants(bbox);
  const btcComms = useMapCommunities();
  const globe = useGlobeStats();
  const countryStat = countryFromGlobe(globe.data, focus?.iso);

  const places = useMemo(() => {
    if (filter === "comunidades") return [];
    const extra: MerchantPlace[] = Object.entries(store)
      .filter(([, s]) => !s.removed && s.lat != null && s.lon != null)
      .map(([id, s]) => ({
        id,
        lat: s.lat!,
        lon: s.lon!,
        name: s.name || id,
        category: s.category || "propuesta",
        createdAt: s.listedAt,
        description: s.description,
      }));
    const seen = new Set(extra.map((p) => p.id));
    const api = (query.data ?? []).filter((p) => !store[p.id]?.removed && !seen.has(p.id));
    const rows = [...extra, ...api];
    if (filter === "todas") return rows;
    return rows.filter((p) => gradeOf(store[p.id], Date.now()).band === filter);
  }, [query.data, store, filter]);

  const overlayComms = comms;
  const allComms = useMemo(() => {
    const map = new Map<string, Community>();
    for (const c of btcComms.data ?? []) map.set(c.id || c.slug, c);
    for (const c of overlayComms) map.set(c.id || c.slug, c);
    if (![...map.values()].some((c) => c.id === FOUNDING_UY.id || c.slug === FOUNDING_UY.slug)) {
      map.set(FOUNDING_UY.id, {
        id: FOUNDING_UY.id,
        slug: FOUNDING_UY.slug,
        name: FOUNDING_UY.name,
        lat: FOUNDING_UY.lat,
        lon: FOUNDING_UY.lon,
        logo: FOUNDING_UY.logo,
        description: "",
        links: [],
        createdAt: 0,
        score: 0,
        voteCount: 0,
        verifiedAt: 1,
      });
    }
    return dedupeCommunities([...map.values()]);
  }, [btcComms.data, overlayComms]);

  const visibleComms = useMemo(() => {
    if (filter !== "todas" && filter !== "comunidades") return [];
    const isoBox: Record<string, { s: number; n: number; w: number; e: number }> = {
      UY: { s: -35.15, n: -30.05, w: -58.6, e: -53.0 },
      AR: { s: -55.1, n: -21.7, w: -73.6, e: -53.5 },
      BR: { s: -34.0, n: 5.3, w: -74.1, e: -32.3 },
      CL: { s: -56.1, n: -17.4, w: -75.8, e: -66.3 },
      PY: { s: -27.7, n: -19.2, w: -62.7, e: -54.2 },
    };
    const box = focus?.iso ? isoBox[focus.iso.toUpperCase()] : null;
    const rows = allComms.filter((c) => {
      const founding = c.id === FOUNDING_UY.id || c.slug === FOUNDING_UY.slug;
      const pad = founding ? 2.6 : 0.6;
      if (c.lon >= bbox.west - pad && c.lon <= bbox.east + pad && c.lat >= bbox.south - pad && c.lat <= bbox.north + pad) return true;
      if (box && c.lat >= box.s && c.lat <= box.n && c.lon >= box.w && c.lon <= box.e) return true;
      return false;
    });
    return rows;
  }, [allComms, bbox, filter, focus?.iso]);

  useEffect(() => {
    if (!focus?.id) return;
    const comm = allComms.find((c) => c.id === focus.id || c.slug === focus.id);
    if (comm) {
      setSelComm(comm);
      setSel(null);
      return;
    }
    const place = places.find((p) => p.id === focus.id);
    if (place) {
      setSel(place);
      setSelComm(null);
    }
  }, [focus?.id, allComms, places]);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let dead = false;
    let map: import("leaflet").Map | null = null;
    void import("leaflet/dist/leaflet.css");
    void import("leaflet").then((L) => {
      if (dead || !mapEl.current || mapRef.current) return;
      map = L.map(mapEl.current, { zoomControl: false, attributionControl: true, minZoom: 2, maxZoom: 19 }).setView(
        focus ? [focus.lat, focus.lon] : [20, -40],
        focus?.zoom ?? 4,
      );
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://btcmap.org">BTC Map</a>',
        subdomains: "abc",
        maxZoom: 19,
      }).addTo(map);
      osm.on("tileerror", () => {
        if (!map || (map as { _bitacoraFb?: boolean })._bitacoraFb) return;
        (map as { _bitacoraFb?: boolean })._bitacoraFb = true;
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
          attribution: "Esri · OSM · BTC Map",
          maxZoom: 19,
        }).addTo(map);
      });
      L.control.zoom({ position: "topright" }).addTo(map);
      leafletRef.current = L;
      const group = L.layerGroup().addTo(map);
      userMark.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      marks.current = group;
      requestAnimationFrame(() => map?.invalidateSize());
      const pushBbox = () => {
        if (!map) return;
        const b = map.getBounds();
        setBbox({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
      };
      map.on("moveend", pushBbox);
      map.on("zoomend", () => {
        if (!map) return;
        if (map.getZoom() <= 2) onWorldRef.current?.();
      });
      map.on("click", (ev: { latlng: { lat: number; lng: number } }) => {
        setDrop({ lat: ev.latlng.lat, lon: ev.latlng.lng });
        setSel(null);
        setSelComm(null);
        setHit(null);
      });
      requestAnimationFrame(() => map?.invalidateSize());
      pushBbox();
      if (focus && Number.isFinite(focus.lat) && Number.isFinite(focus.lon)) {
        setGeo("ok");
        return;
      }
      void locateBest(false, (lat, lon, zoom) =>
        getCityFrame({ data: { lat, lon, zoom } }).catch(() => boxAround(lat, lon)),
      )
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
      const occupied = new Set<string>();
      const z = map.getZoom();
      const clat = map.getCenter().lat;
      const mpp = (40075016.686 * Math.cos((clat * Math.PI) / 180)) / (256 * 2 ** z);
      const gapDeg = Math.max(0.0009, (36 * mpp) / (111320 * Math.max(0.2, Math.cos((clat * Math.PI) / 180))));
      const laid = layoutCityLogos(visibleComms, gapDeg);
      for (const c of laid) {
        occupied.add(`${c.lat.toFixed(5)},${c.lon.toFixed(5)}`);
        occupied.add(`${c.lat.toFixed(4)},${c.lon.toFixed(4)}`);
        occupied.add(`${c.lat0.toFixed(4)},${c.lon0.toFixed(4)}`);
        const trust = communityTrust(c);
        const logo = logoUrl(c.logo || "");
        const face = logo
          ? `<img src="${logo.replace(/"/g, "")}" alt="" width="28" height="28" style="width:28px;height:28px;border-radius:50%;object-fit:cover;display:block;background:#f7931a" />`
          : `<span style="display:block;width:28px;height:28px">${BITCOIN_MARK_SVG}</span>`;
        const check = trust.verified
          ? `<span style="position:absolute;right:-5px;bottom:-5px;width:16px;height:16px;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35))">${VERIFIED_STAR_HTML}</span>`
          : "";
        const icon = L.divIcon({
          className: "",
          html: `<div style="position:relative;width:32px;height:32px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #f7931a;display:flex;align-items:center;justify-content:center;overflow:visible">${face}${check}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const m = L.marker([c.lat, c.lon], { icon, zIndexOffset: 400 });
        m.on("click", (ev) => {
          L.DomEvent.stopPropagation(ev);
          setSelComm(c);
          setSel(null);
          setDrop(null);
        });
        const tip = `<div style="display:flex;gap:8px;align-items:center;min-width:140px">
          ${logo ? `<img src="${logo}" alt="" width="32" height="32" style="border-radius:50%;object-fit:cover" />` : ""}
          <div><strong>${c.name.replace(/</g, "")}</strong><br/><span style="opacity:.7">@${c.slug.replace(/</g, "")}</span></div>
        </div>`;
        m.bindTooltip(tip, { direction: "top", sticky: true, opacity: 1 });
        m.addTo(group);
      }
      for (const p of places) {
        const k = `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`;
        if (occupied.has(k)) continue;
        occupied.add(k);
        const selected = hit && hit.kind === "place" && hit.id === p.id;
        const size = selected ? 36 : 26;
        const m = L.marker([p.lat, p.lon], {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:${size}px;height:${size}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))">${BITCOIN_MARK_SVG}</div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          }),
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
      const { fix, city } = await locateBest(preferGps, (lat, lon, zoom) =>
        getCityFrame({ data: { lat, lon, zoom } }).catch(() => boxAround(lat, lon)),
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

  function persist(nextStore: Record<string, MerchantLocal>, nextComms: Community[]) {
    saveStore(nextStore);
    saveCommunities(nextComms);
    const csv = dumpMapCsv(nextStore, nextComms, query.data ?? []);
    writeExtra(CSV_CACHE, csv);
    void saveMapCsv({ data: { csv } }).then(
      (r) => {
        if (r.ok) setSync("on");
        void invalidate(csv);
      },
      () => setSync("fail"),
    );
  }

  function commit(id: string, next: MerchantLocal) {
    const data = { ...store, [id]: next };
    setStore(data);
    persist(data, comms);
    void upsertPlace(id, next).then(
      (ok) => {
        if (ok) setSync("on");
      },
      () => setSync("fail"),
    );
  }

  function vote(place: MerchantPlace) {
    if (!captchaOk) {
      setFormErr(t("captchaNeed"));
      return;
    }
    const prev = store[place.id] ?? { description: "", votes: [], listedAt: place.createdAt };
    const by = nick.trim() || "colaborador";
    writeExtra("bitacora-nick", by);
    const tally = addScore(prev.score ?? 0, prev.voteCount ?? prev.votes.length, stars);
    commit(place.id, {
      ...prev,
      description: draft.trim() || prev.description,
      votes: [...prev.votes, { stars, at: Date.now(), by }],
      listedAt: prev.listedAt || place.createdAt,
      updatedAt: Date.now(),
      score: tally.score,
      voteCount: tally.votes,
      lat: prev.lat ?? place.lat,
      lon: prev.lon ?? place.lon,
      name: prev.name || place.name,
      category: prev.category || place.category,
    });
    setCaptchaOk(false);
    setFormErr("");
  }

  function propose() {
    if (!drop || !shopName.trim()) return;
    const issues = addrHit && shopAddr.trim() === formatStreet(addrHit, lang) ? addressIssues(addrHit) : (["pick"] as const);
    if (issues.length) {
      setFormErr(t("addrNeedPick"));
      return;
    }
    if (!captchaOk) {
      setFormErr(t("captchaNeed"));
      return;
    }
    const id = `local:${drop.lat.toFixed(5)},${drop.lon.toFixed(5)}`;
    const place: MerchantPlace = {
      id,
      lat: drop.lat,
      lon: drop.lon,
      name: shopName.trim().slice(0, 80),
      category: "propuesta",
      createdAt: Date.now(),
      description: shopDesc.trim() || undefined,
    };
    const tally = addScore(0, 0, stars);
    commit(id, {
      description: shopDesc.trim(),
      notes: shopNotes.trim(),
      votes: [{ stars, at: Date.now(), by: nick.trim() || "colaborador" }],
      listedAt: Date.now(),
      updatedAt: Date.now(),
      score: tally.score,
      voteCount: tally.votes,
      links: linksFromPicked(picked, handles),
      hours: shopHours,
      pays: shopPays,
      address: shopAddr.trim(),
      logo: logoUrl(shopLogo) || undefined,
      lat: drop.lat,
      lon: drop.lon,
      name: shopName.trim().slice(0, 80),
      category: "propuesta",
      verifyToken: makePinToken(),
    });
    setSel(place);
    setDrop(null);
    setPicked([]);
    setHandles({});
    setShopName("");
    setShopDesc("");
    setShopNotes("");
    setShopHours(EMPTY_HOURS);
    setShopPays([]);
    setShopAddr("");
    setAddrHit(null);
    setShopLogo("");
    setCaptchaOk(false);
    setFormErr("");
  }

  function voteCommunity(c: Community) {
    if (!captchaOk) {
      setFormErr(t("captchaNeed"));
      return;
    }
    const by = nick.trim() || "colaborador";
    writeExtra("bitacora-nick", by);
    const tally = addScore(c.score ?? 0, c.voteCount ?? c.votes?.length ?? 0, stars);
    const row: Community = {
      ...c,
      votes: [...(c.votes ?? []), { stars, at: Date.now(), by }],
      score: tally.score,
      voteCount: tally.votes,
    };
    const next = comms.some((x) => x.id === c.id) ? comms.map((x) => (x.id === c.id ? row : x)) : [...comms, row];
    setComms(next);
    persist(store, next);
    setSelComm(row);
    void upsertCommunity(row).then(
      (ok) => {
        if (ok) setSync("on");
      },
      () => setSync("fail"),
    );
    setCaptchaOk(false);
    setFormErr("");
  }

  function pinFromAddress(hit: StreetHit) {
    setDrop({ lat: hit.lat, lon: hit.lon });
    setMode("comercio");
    setShopAddr(formatStreet(hit, lang));
    setAddrHit(hit);
    mapRef.current?.setView([hit.lat, hit.lon], 17, { animate: true });
  }

  function saveCommunity() {
    if (!drop) return;
    if (!captchaOk) {
      setFormErr(t("captchaNeed"));
      return;
    }
    const slug = slugify(form.slug || form.name);
    if (!slug) {
      setFormErr(t("needSlug"));
      return;
    }
    if (comms.some((c) => c.slug === slug)) {
      setFormErr(t("slugTaken"));
      return;
    }
    const row: Community = {
      id: `c:${slug}`,
      slug,
      name: form.name.trim() || slug,
      lat: drop.lat,
      lon: drop.lon,
      logo: logoUrl(form.logo) || form.logo,
      description: form.description.trim(),
      links: linksFromPicked(picked, handles),
      createdAt: Date.now(),
      votes: [],
      verifyToken: makePinToken(),
    };
    const next = [...comms, row];
    setComms(next);
    persist(store, next);
    setSelComm(row);
    setDrop(null);
    setForm(EMPTY_FORM);
    setFormErr("");
    setPicked([]);
    setHandles({});
    setCaptchaOk(false);
    void upsertCommunity(row).then(
      (ok) => {
        if (ok) setSync("on");
      },
      () => setSync("fail"),
    );
  }

  function toggleSocial(k: SocialKey) {
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  const local = sel ? store[sel.id] : undefined;
  const g = sel ? gradeOf(local, Date.now()) : null;
  const shopTrust = sel
    ? listingTrust(local?.links, g?.avg ?? 0, g?.count ?? 0, (local?.verifiedAt ?? 0) > 0)
    : null;
  const removable = sel ? canRemove(local) : false;
  const chips: (GradeBand | "todas" | "comunidades")[] = ["todas", "comunidades", "alta", "media", "baja", "nueva"];

  const body = (
    <>
      <section className="space-y-3">
        <h2 className="font-display flex items-center gap-[0.28em] text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          <span>
            {t("mapTitle")} {t("mapOf")}
          </span>
          <BitcoinMark className="h-[0.9em] w-[0.9em] shrink-0" />
        </h2>
        <p className="text-base text-pretty text-muted-foreground">{t("mapLead")}</p>
        {countryStat ? (
          <p className="font-mono text-sm text-foreground">
            {(() => {
              try {
                return new Intl.DisplayNames([localeTag(lang)], { type: "region" }).of(countryStat.iso) || countryStat.iso;
              } catch {
                return countryStat.iso;
              }
            })()}
            {" · "}
            {countryStat.cities.toLocaleString()} {t("globeCities")} · {countryStat.shops.toLocaleString()} {t("globeShops")} · {countryStat.comms.toLocaleString()} {t("globeComms")} ·{" "}
            {countryStat.events.toLocaleString()} {t("globeEvents")}
          </p>
        ) : globe.data ? (
          <p className="font-mono text-sm text-muted-foreground">
            {globe.data.world.cities.toLocaleString()} {t("globeCities")} · {globe.data.world.shops.toLocaleString()} {t("globeShops")} · {globe.data.world.comms.toLocaleString()} {t("globeComms")} ·{" "}
            {globe.data.world.events.toLocaleString()} {t("globeEvents")}
          </p>
        ) : null}
        <p className={cn("text-xs", sync === "fail" ? "text-primary" : "text-muted-foreground")}>
          {sync === "on" ? t("mapCsvOn") : sync === "wait" ? t("mapSyncWait") : sync === "fail" ? t("mapSyncFail") : t("mapSyncOff")}
        </p>
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
            <MapSearch communities={allComms} places={places} onPick={flyTo} />
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
            <div className="space-y-3">
              <CommunityCard
                community={selComm}
                onToken={(token) => {
                  const next = comms.map((c) => (c.id === selComm.id ? { ...c, verifyToken: token } : c));
                  setComms(next);
                  persist(store, next);
                }}
                onVerified={() => {
                  const next = comms.map((c) => (c.id === selComm.id ? { ...c, verifiedAt: Date.now() } : c));
                  setComms(next);
                  persist(store, next);
                }}
              />
              <StarMeter score={selComm.score ?? 0} votes={selComm.voteCount ?? selComm.votes?.length ?? 0} />
              <label className="block text-sm">
                {t("fldNick")}
                <input
                  className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                />
              </label>
              <div className="flex gap-1" role="group" aria-label={t("ratingAria")}>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-md",
                      n <= stars ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-label={t("starsN", { n })}
                  >
                    <Star className="size-5" fill={n <= stars ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <CaptchaBox key={selComm.id} ok={captchaOk} onOk={setCaptchaOk} />
              {formErr ? <p className="text-sm text-short">{formErr}</p> : null}
              <Button className="w-full" onClick={() => voteCommunity(selComm)} disabled={!captchaOk}>
                {t("publishVote")}
              </Button>
            </div>
          ) : sel ? (
            <div className="space-y-3">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{sel.category}</p>
              <div className="flex items-center gap-3">
                {local?.logo ? (
                  <img src={local.logo} alt="" className="size-14 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                    ₿
                  </span>
                )}
                <div>
                <h3 className="flex items-center gap-2 text-lg font-medium text-foreground">
                  {sel.name}
                  {shopTrust?.verified ? (
                    <VerifiedStar title={t("verified")} className="size-7" />
                  ) : null}
                </h3>
                {!shopTrust?.verified ? (
                  <p className="text-xs text-muted-foreground">{t("verifyPending")}</p>
                ) : null}
                </div>
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
              {sel && shopTrust && !shopTrust.verified ? (
                <ScrapeVerifyBox
                  id={sel.id}
                  token={local?.verifyToken}
                  hasLinks={Boolean(local?.links?.length)}
                  onToken={(token) => commit(sel.id, { ...(local as MerchantLocal), verifyToken: token })}
                  onVerified={() =>
                    commit(sel.id, { ...(local as MerchantLocal), verifiedAt: Date.now(), verifyToken: local?.verifyToken })
                  }
                />
              ) : null}
              <label className="block text-sm">
                {t("fldNick")}
                <input
                  className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                {t("fldDesc")}
                <textarea
                  className="mt-1 min-h-20 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("phVote")}
                />
              </label>
              <div className="flex gap-1" role="group" aria-label={t("ratingAria")}>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-md",
                      n <= stars ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-label={t("starsN", { n })}
                  >
                    <Star className="size-5" fill={n <= stars ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <CaptchaBox key={sel.id} ok={captchaOk} onOk={setCaptchaOk} />
              {formErr ? <p className="text-sm text-short">{formErr}</p> : null}
              <Button className="w-full" onClick={() => vote(sel)} disabled={!captchaOk}>
                {t("publishVote")}
              </Button>
              {removable ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => commit(sel.id, { ...(local as MerchantLocal), removed: true })}
                >
                  {t("removeLow")}
                </Button>
              ) : null}
            </div>
          ) : drop ? (
            <div className="space-y-3">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("newPoint")}</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  className={cn("h-8 rounded-md px-3 text-xs", mode === "comercio" ? "bg-primary text-white" : "bg-elevated")}
                  onClick={() => setMode("comercio")}
                >
                  {t("modeShop")}
                </button>
                <button
                  type="button"
                  className={cn("h-8 rounded-md px-3 text-xs", mode === "comunidad" ? "bg-primary text-white" : "bg-elevated")}
                  onClick={() => setMode("comunidad")}
                >
                  {t("modeComm")}
                </button>
              </div>
              {mode === "comercio" ? (
                <div className="space-y-2">
                  <label className="block text-sm">
                    {t("fldName")}
                    <input
                      className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder={t("phName")}
                    />
                  </label>
                  <label className="block text-sm">
                    {t("fldDesc")}
                    <textarea
                      className="mt-1 min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
                      value={shopDesc}
                      onChange={(e) => setShopDesc(e.target.value)}
                      placeholder={t("phDesc")}
                    />
                  </label>
                  <label className="block text-sm">
                    {t("fldNotes")}
                    <textarea
                      className="mt-1 min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm shadow-[var(--shadow-border)]"
                      value={shopNotes}
                      onChange={(e) => setShopNotes(e.target.value)}
                      placeholder={t("phNotes")}
                    />
                  </label>
                  <AddressSearch
                    value={shopAddr}
                    hit={addrHit}
                    onChange={(v) => {
                      setShopAddr(v);
                      if (!addrHit || v.trim() !== formatStreet(addrHit, lang)) setAddrHit(null);
                    }}
                    onPick={pinFromAddress}
                  />
                  <LogoPicker value={shopLogo} onChange={setShopLogo} />
                  <HoursEditor value={shopHours} onChange={setShopHours} />
                  <PayPicker value={shopPays} onChange={setShopPays} />
                  <SocialPicker
                    picked={picked}
                    handles={handles}
                    onToggle={toggleSocial}
                    onHandle={(k, v) => setHandles((h) => ({ ...h, [k]: v }))}
                  />
                  <CaptchaBox key="shop" ok={captchaOk} onOk={setCaptchaOk} />
                  {formErr ? <p className="text-sm text-short">{formErr}</p> : null}
                  <Button
                    className="w-full"
                    onClick={propose}
                    disabled={!captchaOk || addressIssues(addrHit).length > 0}
                  >
                    {t("proposeShop")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    className="h-10 w-full rounded-md bg-elevated px-3 text-sm"
                    placeholder={t("phCommName")}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    className="h-10 w-full rounded-md bg-elevated px-3 text-sm"
                    placeholder={t("phSlug")}
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                  <textarea
                    className="min-h-16 w-full rounded-md bg-elevated px-3 py-2 text-sm"
                    placeholder={t("phCommDesc")}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <LogoPicker
                    value={form.logo}
                    onChange={(logo) => setForm((f) => ({ ...f, logo }))}
                  />
                  <SocialPicker
                    picked={picked}
                    handles={handles}
                    onToggle={toggleSocial}
                    onHandle={(k, v) => setHandles((h) => ({ ...h, [k]: v }))}
                  />
                  <CaptchaBox key="comm" ok={captchaOk} onOk={setCaptchaOk} />
                  {formErr ? <p className="text-sm text-short">{formErr}</p> : null}
                  <Button className="w-full" onClick={saveCommunity} disabled={!captchaOk}>
                    {t("publishComm")}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("pickSpot")}</p>
          )}
        </aside>
      </div>

      <section className="mt-4 rounded-lg bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium tracking-wide text-foreground uppercase">{t("verifyHow")}</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          <li>— {t("verifyId")}</li>
          <li>— {t("verifyRep")}</li>
          <li>— {t("verifyScrape")}</li>
        </ul>
        <p className="mt-3 flex items-start gap-2 text-sm text-foreground">
          <VerifiedStar title={t("verified")} className="mt-0.5 size-6 shrink-0" />
          <span>{t("verifyBadge")}</span>
        </p>
      </section>

      {!embedded ? (
        <section className="mt-4">
          <CommunityFeedPanel />
        </section>
      ) : null}
    </>
  );
  return embedded ? body : <SiteShell>{body}</SiteShell>;
}

function CommunityCard({
  community,
  onToken,
  onVerified,
}: {
  community: Community;
  onToken: (token: string) => void;
  onVerified: () => void;
}) {
  const t = useT();
  const trust = communityTrust(community);
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => {
    setImgOk(true);
  }, [community.id, community.logo]);
  const showImg = Boolean(community.logo) && imgOk;
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1 text-xs tracking-wide text-muted-foreground uppercase">
        <Users className="size-3.5" />
        {t("modeComm")}
      </p>
      <div className="flex items-center gap-3">
        {showImg ? (
          <img
            src={community.logo}
            alt=""
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
      {community.description ? <p className="text-sm text-pretty">{community.description}</p> : null}
      <SocialRow links={community.links} />
      {!trust.verified ? (
        <ScrapeVerifyBox
          id={community.id}
          token={community.verifyToken}
          hasLinks={community.links.length > 0}
          onToken={onToken}
          onVerified={onVerified}
        />
      ) : null}
    </div>
  );
}

function ScrapeVerifyBox({
  id,
  token,
  hasLinks,
  onToken,
  onVerified,
}: {
  id: string;
  token?: string;
  hasLinks: boolean;
  onToken: (token: string) => void;
  onVerified: () => void;
}) {
  const t = useT();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const tokenFn = useRef(onToken);
  const doneFn = useRef(onVerified);
  tokenFn.current = onToken;
  doneFn.current = onVerified;
  useEffect(() => {
    if (!token) tokenFn.current(makePinToken());
  }, [id, token]);
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
  return (
    <div className="space-y-2 rounded-md bg-elevated px-3 py-2 text-sm">
      <p className="text-muted-foreground">{t("verifyScrapeHint")}</p>
      {token ? (
        <p>
          <code className="rounded bg-primary px-1.5 py-0.5 font-mono text-sm font-bold text-white">{token}</code>
        </p>
      ) : null}
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
