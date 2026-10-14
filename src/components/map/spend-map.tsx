import { useEffect, useMemo, useRef, useState } from "react";
import { Locate } from "lucide-react";
import type { Community, MerchantLocal, MerchantPlace } from "@/domain";
import { pinAsPlace, refineShopIcon } from "@/domain";
import { STATUES } from "@/domain/statues";
import { FOUNDING_UY, type GlobeFocus } from "@/domain/globe";
import { canRemove, communityIsPublic, communityTrust, dumpMapCsv, hydrateMapCsv, imgSrc, listingTrust, shopIsPublic, withFoundingProfile } from "@/domain";
import { dedupeCommunities, dedupeShops, pickListingLogo, placeTruePins } from "@/domain/community-dedupe";
import { coinPinSize, pinBadgeSize } from "@/domain/map-pin-size";
import { VERIFIED_STAR_HTML, VerifiedStar } from "./verified-star";
import { linksFromPicked, type SocialKey } from "@/domain/socials";
import { publishCommunity, publishShop, rateCommunityListing, rateShopListing } from "@/application/map-listings";
import { getCityFrame, getMerchant, saveMapCsv, submitMapListing, cancelMapListing, verifyMapListing, reverseAddress } from "@/infrastructure/server-fns";
import { LEGAL } from "@/domain/legal-config";
import { formatGuideMeters, formatGuideStep } from "@/domain/guide";
import { localeTag } from "@/lib/display";
import { countryFromGlobe, prefetchEventPage, useGlobeStats, useMapCommunities, useMapCsv, useMapMerchants, useMapStore, type MapBbox } from "@/lib/map-query";
import { boxAround } from "@/domain";
import { OFM_ATTR, OFM_STYLE, OSMFR_ATTR, OSMFR_URL, OTM_ATTR, OTM_URL } from "@/domain/map-tiles";
import { geoBannerKey } from "@/domain/geo-fix";
import { locateBest } from "@/infrastructure/geo";
import { applyFix } from "./leaflet-fix";
import { useMapGuide } from "./use-map-guide";
import { useAppLang, useT } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";
import { cn, escapeHtml } from "@/lib/utils";
import { extrasAllowed, readExtra, writeExtra } from "@/lib/storage-consent";
import { CommunityFeedPanel } from "@/components/dashboard/community-feed";
import { BitcoinMark, BITCOIN_MARK_SVG } from "@/components/dashboard/brand-mark";
import { SiteShell } from "@/components/site-header";
import { MapSearch, type SearchHit } from "./map-search";
import { hoursToCsv, paysToCsv, socialsToCsv } from "@/domain/map-csv";
import { CommunityCard, PlaceCard } from "./map-listing-card";
import { CargaPendingView, holdCargaSpinner } from "./carga-proof-step";
import { ListingPatchForm } from "./map-patch-form";
import { MapDropPick, MapVotePanel, StarMeter } from "./map-panels";
import { EMPTY_COMM_FORM, MapComposeForm, type CommForm } from "./map-compose-form";
import { EMPTY_HOURS, type WeekHours } from "@/domain/hours";
import type { PayKey } from "@/domain/pays";
import { type CaptchaTicket } from "./captcha";
import { formatStreet, type StreetHit } from "@/infrastructure/address";
import { onJoinMap } from "@/application/join-map";
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
const PENDING_MAP = "bitacora-map-pending";

/** Carga local a la espera de la URL pública con el código CARGA-XXXX. */
type PendingCarga = {
  kind: "shop" | "community";
  id: string;
  token: string;
  name: string;
  lat: number;
  lon: number;
  slug?: string;
  created: number;
};

function readPendingMap(): PendingCarga | null {
  try {
    const raw = sessionStorage.getItem(PENDING_MAP) || localStorage.getItem(PENDING_MAP);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingCarga;
    if (!p.id || !p.token || (p.kind !== "shop" && p.kind !== "community")) return null;
    return p;
  } catch {
    return null;
  }
}

function writePendingMap(p: PendingCarga | null) {
  try {
    if (!p) {
      sessionStorage.removeItem(PENDING_MAP);
      localStorage.removeItem(PENDING_MAP);
      return;
    }
    const raw = JSON.stringify(p);
    sessionStorage.setItem(PENDING_MAP, raw);
    localStorage.setItem(PENDING_MAP, raw);
  } catch {
    /* quota */
  }
}

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

function coinFaceHtml(logo: string, size: number) {
  const src = escapeHtml(imgSrc(logo)).replace(/"/g, "");
  if (src) {
    return `<img src="${src}" alt="" width="${size}" height="${size}" referrerpolicy="no-referrer" decoding="async" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block;background:#f7931a" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" /><span style="display:none;width:${size}px;height:${size}px">${BITCOIN_MARK_SVG}</span>`;
  }
  return `<span style="display:block;width:${size}px;height:${size}px">${BITCOIN_MARK_SVG}</span>`;
}

const CSV_CACHE = "bitacora-map-csv-v1";

function applyCsv(text: string) {
  return hydrateMapCsv(text);
}

export function SpendMap({ focus, onWorld, embedded = false }: { focus?: GlobeFocus; onWorld?: () => void; embedded?: boolean }) {
  const t = useT();
  const lang = useAppLang();
  const {
    mapRef,
    leafletRef,
    userMark,
    pickOriginRef,
    onPickOrigin,
    geo,
    setGeo,
    guideWait,
    guideErr,
    guideSteps,
    pickOrigin: _pickOrigin,
    clearRoute,
    goToUser,
    startGuide,
  } = useMapGuide(lang, t);
  const [geoNotice, setGeoNotice] = useState(false);
  const { qc, invalidate } = useMapStore();
  const onWorldRef = useRef(onWorld);
  onWorldRef.current = onWorld;
  const skipWorldRef = useRef(false);
  const lockWorldRef = useRef(false);
  const mapEl = useRef<HTMLDivElement>(null);
  const marks = useRef<import("leaflet").LayerGroup | null>(null);
  const hitMark = useRef<import("leaflet").Layer | null>(null);
  const dropMark = useRef<import("leaflet").Layer | null>(null);
  const proofRef = useRef<HTMLDivElement>(null);
  const joinedRef = useRef(false);
  const [hit, setHit] = useState<SearchHit | null>(null);
  const [bbox, setBbox] = useState<MapBbox | null>(null);
  const [zoom, setZoom] = useState(focus?.zoom ?? 4);
  const [mapReady, setMapReady] = useState(false);
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
  const shopAddrRef = useRef("");
  const [shopLogo, setShopLogo] = useState("");
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [nick, setNick] = useState("colaborador");
  const [filter, setFilter] = useState<"todas" | "comercios" | "comunidades">("todas");
  const [drop, setDrop] = useState<{ lat: number; lon: number } | null>(null);
  const [dropKind, setDropKind] = useState<"pick" | "comercio" | "comunidad">("pick");
  const [voteOpen, setVoteOpen] = useState(false);
  const [patchOpen, setPatchOpen] = useState(false);
  const [mode, setMode] = useState<"comercio" | "comunidad">("comercio");
  const [form, setForm] = useState<CommForm>(EMPTY_COMM_FORM);
  const [formErr, setFormErr] = useState("");
  const [privacyOk, setPrivacyOk] = useState(false);
  const [linkOk, setLinkOk] = useState(false);
  const [picked, setPicked] = useState<SocialKey[]>([]);
  const [handles, setHandles] = useState<Partial<Record<SocialKey, string>>>({});
  const [captchaOk, setCaptchaOk] = useState(false);
  const [ticket, setTicket] = useState<CaptchaTicket | null>(null);
  const ticketRef = useRef<CaptchaTicket | null>(null);
  function keepTicket(next: CaptchaTicket | null) {
    ticketRef.current = next;
    setTicket(next);
  }
  const [pendingCarga, setPendingCarga] = useState<PendingCarga | null>(null);
  const [cargaBusy, setCargaBusy] = useState(false);
  const [cargaGenerating, setCargaGenerating] = useState(false);
  const [sync, setSync] = useState<"off" | "wait" | "on" | "fail">(firebaseConfigured() ? "wait" : "off");

  shopAddrRef.current = shopAddr;
  // Con pin o CARGA pendiente no se vuelve al globo (un zoomend falso perdía la validación).
  lockWorldRef.current = Boolean(drop || pendingCarga || cargaGenerating);

  function stayOnMap(lat: number, lon: number, z = 16) {
    const map = mapRef.current;
    if (!map || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const box = document.querySelector(".scroll-free:not([inert])");
    const y = box instanceof HTMLElement ? box.scrollTop : 0;
    const win = window.scrollY;
    skipWorldRef.current = true;
    map.setView([lat, lon], Math.max(map.getZoom() || 0, z), { animate: false });
    map.invalidateSize();
    const restore = () => {
      if (box instanceof HTMLElement) box.scrollTop = y;
      if (window.scrollY !== win) window.scrollTo(0, win);
    };
    restore();
    requestAnimationFrame(restore);
    window.setTimeout(() => {
      restore();
      skipWorldRef.current = false;
    }, 500);
  }

  useEffect(() => {
    if (!drop || dropKind !== "comercio") return;
    if (shopAddrRef.current.trim()) return;
    const pin = drop;
    let stop = false;
    void reverseAddress({ data: { lat: pin.lat, lon: pin.lon, lang } }).then((hit) => {
      if (stop || !hit || shopAddrRef.current.trim()) return;
      // La calle se autocompleta; el pin se queda en la puerta que marcaron (no en el eje OSM).
      const next = { ...hit, lat: pin.lat, lon: pin.lon, fromMap: true as const };
      setAddrHit(next);
      setShopAddr(formatStreet(next, lang));
    }).catch(() => {});
    return () => {
      stop = true;
    };
  }, [drop, dropKind, lang]);

  useEffect(() => {
    setNick(readExtra("bitacora-nick", "colaborador"));
    const cached = extrasAllowed() ? readExtra(CSV_CACHE, "") : "";
    const pending = readPendingMap();
    const localStore = loadStore();
    const localComms = loadCommunities();
    if (cached) {
      const next = applyCsv(cached);
      const store0 = { ...localStore, ...next.store };
      const comms0 = mergeCommunities(localComms, next.comms);
      if (pending?.kind === "shop" && !store0[pending.id]) {
        store0[pending.id] = {
          description: "",
          votes: [],
          listedAt: pending.created,
          lat: pending.lat,
          lon: pending.lon,
          name: pending.name,
          category: "propuesta",
          verifyToken: pending.token,
          verifiedAt: 0,
        };
      }
      setStore(store0);
      if (pending?.kind === "community" && !comms0.some((c) => c.id === pending.id)) {
        setComms([
          ...comms0,
          {
            id: pending.id,
            slug: pending.slug || pending.id.replace(/^c:/, ""),
            name: pending.name,
            lat: pending.lat,
            lon: pending.lon,
            logo: "",
            description: "",
            links: [],
            createdAt: pending.created,
            verifyToken: pending.token,
            verifiedAt: 0,
          },
        ]);
      } else {
        setComms(comms0);
      }
    } else {
      if (pending?.kind === "shop" && !localStore[pending.id]) {
        localStore[pending.id] = {
          description: "",
          votes: [],
          listedAt: pending.created,
          lat: pending.lat,
          lon: pending.lon,
          name: pending.name,
          category: "propuesta",
          verifyToken: pending.token,
          verifiedAt: 0,
        };
      }
      setStore(localStore);
      if (pending?.kind === "community" && !localComms.some((c) => c.id === pending.id)) {
        setComms([
          ...localComms,
          {
            id: pending.id,
            slug: pending.slug || pending.id.replace(/^c:/, ""),
            name: pending.name,
            lat: pending.lat,
            lon: pending.lon,
            logo: "",
            description: "",
            links: [],
            createdAt: pending.created,
            verifyToken: pending.token,
            verifiedAt: 0,
          },
        ]);
      } else {
        setComms(localComms);
      }
    }
    if (pending) {
      setPendingCarga(pending);
      if (pending.kind === "community") {
        setSelComm({
          id: pending.id,
          slug: pending.slug || pending.id.replace(/^c:/, ""),
          name: pending.name,
          lat: pending.lat,
          lon: pending.lon,
          logo: "",
          description: "",
          links: [],
          createdAt: pending.created,
          verifyToken: pending.token,
          verifiedAt: 0,
        });
        setSel(null);
      } else {
        setSel({
          id: pending.id,
          lat: pending.lat,
          lon: pending.lon,
          name: pending.name,
          category: "propuesta",
          createdAt: pending.created,
        });
        setSelComm(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!mapReady || !pendingCarga) return;
    stayOnMap(pendingCarga.lat, pendingCarga.lon); // recarga: volver al pin, no al océano del setView inicial
  }, [mapReady, pendingCarga?.id]);

  useEffect(() => {
    if (!mapReady || !focus?.join || joinedRef.current) return;
    if (pendingCarga) return;
    joinedRef.current = true;
    setDrop({ lat: focus.lat, lon: focus.lon });
    setDropKind("pick");
    setSel(null);
    setSelComm(null);
    stayOnMap(focus.lat, focus.lon, 16);
  }, [mapReady, focus?.join, focus?.lat, focus?.lon]);

  useEffect(() => {
    if (!pendingCarga && !cargaGenerating) return;
    // Mientras sale el código la página no se mueve: el foco se queda en la carga.
    const box = document.querySelector(".scroll-free:not([inert])");
    const y = box instanceof HTMLElement ? box.scrollTop : 0;
    const win = window.scrollY;
    const restore = () => {
      if (box instanceof HTMLElement && box.scrollTop !== y) box.scrollTop = y;
      if (window.scrollY !== win) window.scrollTo(0, win);
    };
    restore();
    box?.addEventListener("scroll", restore, { passive: true });
    window.addEventListener("scroll", restore, { passive: true });
    return () => {
      box?.removeEventListener("scroll", restore);
      window.removeEventListener("scroll", restore);
    };
  }, [pendingCarga?.id, cargaGenerating]);

  const csvQ = useMapCsv();
  useEffect(() => {
    const text = csvQ.data;
    if (!text?.includes("id,tipo")) return;
    const next = applyCsv(text);
    setStore((prev) => {
      const out = { ...prev, ...next.store };
      for (const [id, s] of Object.entries(prev)) {
        if (id.startsWith("local:") && s.verifyToken && !(s.verifiedAt ?? 0) && !next.store[id]) out[id] = s;
      }
      return out;
    });
    setComms((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      for (const c of next.comms) map.set(c.id, c);
      for (const c of prev) {
        if (c.id.startsWith("c:") && c.verifyToken && !(c.verifiedAt ?? 0) && !next.comms.some((x) => x.id === c.id)) {
          map.set(c.id, c);
        }
      }
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

  const query = useMapMerchants(bbox, zoom);
  const btcComms = useMapCommunities();
  const globe = useGlobeStats();
  const countryStat = countryFromGlobe(globe.data, focus?.iso);

  const places = useMemo(() => {
    if (filter === "comunidades" || !bbox) return [];
    const pad = 0.8;
    const extra: MerchantPlace[] = Object.entries(store)
      .filter(([id, s]) => !s.removed && s.lat != null && s.lon != null && (shopIsPublic(id, s.verifiedAt) || id === sel?.id || Boolean(s.verifyToken && !s.verifiedAt)))
      .filter(
        ([, s]) =>
          s.lon! >= bbox.west - pad &&
          s.lon! <= bbox.east + pad &&
          s.lat! >= bbox.south - pad &&
          s.lat! <= bbox.north + pad,
      )
      .map(([id, s]) => ({
        id,
        lat: s.lat!,
        lon: s.lon!,
        name: s.name || id,
        category: s.category || "propuesta",
        createdAt: s.listedAt,
        description: s.description,
        logo: s.logo,
      }));
    const seen = new Set(extra.map((p) => p.id));
    const api = (query.data ?? [])
      .filter((p) => p && p.id && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon)))
      .filter((p) => !store[p.id]?.removed && !seen.has(p.id))
      .map((p) => {
        const local = store[p.id];
        const place = pinAsPlace(p);
        return {
          ...place,
          lat: local?.lat ?? place.lat,
          lon: local?.lon ?? place.lon,
          name: local?.name || place.name || p.id,
          logo: pickListingLogo(local?.logo),
        };
      });
    const rows = dedupeShops([...extra, ...api]);
    // En la calle no se dibuja el globo con el número: o es una ficha, o no está.
    if (zoom >= 11) return rows.filter((p) => p.category !== "cluster" && !p.id.startsWith("cluster:"));
    return rows;
  }, [query.data, store, filter, bbox, sel?.id, zoom]);

  const overlayComms = comms;
  const allComms = useMemo(() => {
    const map = new Map<string, Community>();
    for (const c of btcComms.data ?? []) map.set(c.id || c.slug, c);
    for (const c of overlayComms) {
      const prev = map.get(c.id) || (c.slug ? map.get(c.slug) : undefined);
      if (prev) {
        map.set(prev.id, {
          ...prev,
          ...c,
          lat: Number.isFinite(c.lat) ? c.lat : prev.lat,
          lon: Number.isFinite(c.lon) ? c.lon : prev.lon,
          logo: pickListingLogo(c.logo, prev.logo),
          name: c.name || prev.name,
        });
      } else {
        map.set(c.id || c.slug, c);
      }
    }
    if (![...map.values()].some((c) => c.id === FOUNDING_UY.id || c.slug === FOUNDING_UY.slug)) {
      map.set(FOUNDING_UY.id, withFoundingProfile({
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
      }));
    }
    return dedupeCommunities([...map.values()].map(withFoundingProfile));
  }, [btcComms.data, overlayComms]);

  const visibleComms = useMemo(() => {
    if (filter === "comercios" || !bbox) return [];
    const isoBox: Record<string, { s: number; n: number; w: number; e: number }> = {
      UY: { s: -35.15, n: -30.05, w: -58.6, e: -53.0 },
      AR: { s: -55.1, n: -21.7, w: -73.6, e: -53.5 },
      BR: { s: -34.0, n: 5.3, w: -74.1, e: -32.3 },
      CL: { s: -56.1, n: -17.4, w: -75.8, e: -66.3 },
      PY: { s: -27.7, n: -19.2, w: -62.7, e: -54.2 },
    };
    const box = focus?.iso ? isoBox[focus.iso.toUpperCase()] : null;
    const rows = allComms.filter((c) => {
      const mine = selComm?.id === c.id || selComm?.slug === c.slug || Boolean(c.verifyToken && !c.verifiedAt);
      if (!communityIsPublic(c) && !mine) return false;
      const founding = c.id === FOUNDING_UY.id || c.slug === FOUNDING_UY.slug;
      const pad = founding ? 2.6 : 0.6;
      if (c.lon >= bbox.west - pad && c.lon <= bbox.east + pad && c.lat >= bbox.south - pad && c.lat <= bbox.north + pad) return true;
      if (box && c.lat >= box.s && c.lat <= box.n && c.lon >= box.w && c.lon <= box.e) return true;
      return false;
    });
    return rows;
  }, [allComms, bbox, filter, focus?.iso, selComm?.id, selComm?.slug]);

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
      if (!place.id.startsWith("local:") && !place.id.startsWith("cluster:")) {
        void getMerchant({ data: { id: place.id } }).then((full) => {
          if (full) setSel(full);
        });
      }
    }
  }, [focus?.id, allComms, places]);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let dead = false;
    let map: import("leaflet").Map | null = null;
    void import("leaflet/dist/leaflet.css");
    void import("leaflet").then((L) => {
      if (dead || !mapEl.current || mapRef.current) return;
      map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 2,
        maxZoom: 19,
        scrollWheelZoom: false,
      });
      // Listener ANTES de setView: si no, el moveend inicial se pierde y el bbox queda el del useState.
      const pushBbox = () => {
        if (!map) return;
        const b = map.getBounds();
        setBbox({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
        setZoom(map.getZoom());
      };
      map.on("moveend", pushBbox);
      map.setView(focus ? [focus.lat, focus.lon] : [20, -40], focus?.zoom ?? 4);
      pushBbox();
      const addOtm = () => {
        if (!map || (map as { _bitacoraFb?: boolean })._bitacoraFb) return;
        (map as { _bitacoraFb?: boolean })._bitacoraFb = true;
        L.tileLayer(OTM_URL, {
          attribution: OTM_ATTR,
          subdomains: "abc",
          maxZoom: 17,
        }).addTo(map);
      };
      const streets = L.tileLayer(OSMFR_URL, {
        attribution: OSMFR_ATTR,
        subdomains: "abc",
        maxZoom: 19,
      }).addTo(map);
      streets.on("tileerror", addOtm);
      void import("maplibre-gl/dist/maplibre-gl.css");
      void import("maplibre-gl")
        .then(async () => {
          const plugin = await import("@maplibre/maplibre-gl-leaflet");
          if (dead || !map) return;
          const gl = plugin.default || plugin.maplibreGL;
          if (typeof gl !== "function") throw new Error("maplibreGL");
          const layer = gl({ style: OFM_STYLE, attributionControl: false }).addTo(map);
          const glMap = layer.getMaplibreMap?.();
          glMap?.on("load", () => {
            try {
              if (glMap.getSource("openmaptiles")) streets.remove();
            } catch {
              /* keep raster streets */
            }
          });
          glMap?.on("error", () => {
            try {
              map?.removeLayer(layer);
            } catch {
              /* raster stays */
            }
          });
          map.attributionControl?.addAttribution(OFM_ATTR);
        })
        .catch(() => {
          /* raster OSM-FR already on the map */
        });
      L.control.zoom({ position: "topright" }).addTo(map);
      leafletRef.current = L;
      const group = L.layerGroup().addTo(map);
      userMark.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      marks.current = group;
      const box = map.getContainer();
      box.tabIndex = 0;
      box.title = t("zoomNeedFocus");
      const wheelOn = () => map?.scrollWheelZoom.enable();
      const wheelOff = () => map?.scrollWheelZoom.disable();
      box.addEventListener("focus", wheelOn);
      box.addEventListener("blur", wheelOff);
      setMapReady(true);
      setZoom(map.getZoom());
      const size = () => map?.invalidateSize({ animate: false });
      requestAnimationFrame(size);
      window.setTimeout(size, 120);
      window.setTimeout(size, 600);
      map.on("zoomend", () => {
        pushBbox();
        if (!map) return;
        const z = map.getZoom();
        // Leaflet, al volar o al achicar el panel, a veces dispara zoom 2 y nos sacaba al globo.
        if (skipWorldRef.current || !Number.isFinite(z) || z > 2) return;
        window.setTimeout(() => {
          const m = mapRef.current;
          if (!m || skipWorldRef.current) return;
          if (m.getZoom() > 2) return;
          if (lockWorldRef.current) {
            m.setZoom(3, { animate: false }); // no globo a mitad de una carga
            return;
          }
          onWorldRef.current?.();
        }, 280);
      });
      map.on("click", (ev: { latlng: { lat: number; lng: number } }) => {
        if (pickOriginRef.current) {
          onPickOrigin.current(ev.latlng.lat, ev.latlng.lng);
          return;
        }
        setDrop({ lat: ev.latlng.lat, lon: ev.latlng.lng });
        setDropKind("pick");
        setSel(null);
        setSelComm(null);
        setHit(null);
        setVoteOpen(false);
        setFormErr("");
        setShopAddr("");
        setAddrHit(null);
      });
      requestAnimationFrame(() => map?.invalidateSize());
      pushBbox();
      if (focus && Number.isFinite(focus.lat) && Number.isFinite(focus.lon)) {
        setGeo("ok");
        return;
      }
      if (!extrasAllowed()) {
        setGeo("idle");
        return;
      }
      void locateBest(false, (lat, lon, zoom) =>
        getCityFrame({ data: { lat, lon, zoom } }).catch(() => boxAround(lat, lon)),
      )
        .then(({ fix, city }) => {
          if (dead || !mapRef.current || !leafletRef.current) return;
          applyFix(leafletRef.current, mapRef.current, userMark.current, fix.lat, fix.lon, fix.accuracy, city);
          mapRef.current.invalidateSize();
          setGeo(fix.source === "gps" ? "ok" : "idle");
        })
        .catch(() => setGeo("denied"));
    });
    return () => {
      dead = true;
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        marks.current = null;
        userMark.current = null;
        dropMark.current = null;
        hitMark.current = null;
        leafletRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const run = () => void prefetchEventPage(qc);
    if (typeof requestIdleCallback === "function") {
      const idle = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(idle);
    }
    const t = window.setTimeout(run, 1200);
    return () => clearTimeout(t);
  }, [mapReady, qc]);

  useEffect(() => {
    const map = mapRef.current;
    const group = marks.current;
    const L = leafletRef.current;
    if (!mapReady || !map || !group || !L) return;
    try {
    group.clearLayers();
      type MapPin = {
        id: string;
        name: string;
        lat: number;
        lon: number;
        logo?: string;
        slug?: string;
        kind: "community" | "shop" | "city";
        verified: boolean;
        count?: number;
        slots?: number;
        comm?: Community;
        place?: MerchantPlace;
      };
      const pins: MapPin[] = [];
      for (const c of visibleComms) {
        pins.push({
          id: c.id,
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          logo: pickListingLogo(c.logo),
          slug: c.slug,
          kind: "community",
          verified: communityTrust(c).verified,
          comm: c,
        });
      }
      for (const p of places) {
        if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
        const clustered = p.category === "cluster" || p.id.startsWith("cluster:") || (p.clusterCount ?? 0) > 1;
        if (clustered) {
          pins.push({
            id: p.id,
            name: p.name,
            lat: p.lat,
            lon: p.lon,
            kind: "city",
            verified: false,
            count: p.clusterCount || Number(p.name) || 1,
          });
          continue;
        }
        const local = store[p.id];
        const count = local?.voteCount ?? local?.votes?.length ?? 0;
        const score = count ? (local?.score ?? 0) : 0;
        pins.push({
          id: p.id,
          name: p.name,
          lat: p.lat,
          lon: p.lon,
          logo: pickListingLogo(local?.logo, p.logo),
          kind: "shop",
          verified: listingTrust(local?.links, score, count, (local?.verifiedAt ?? 0) > 0, p.id.startsWith("local:")).verified,
          place: p,
        });
      }
      const laid = placeTruePins(pins);
      laid.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "shop" ? -1 : a.kind === "city" ? 0 : 1;
        if (a.verified !== b.verified) return a.verified ? 1 : -1;
        return (a.name || "").localeCompare(b.name || "", "es");
      });
      for (const pin of laid) {
        const selected =
          (pin.kind === "shop" && hit?.kind === "place" && hit.id === pin.id) ||
          (pin.kind === "community" && hit?.kind === "community" && hit.id === pin.id);
        const size = coinPinSize(zoom, pin.kind, selected);
        const face = coinFaceHtml(pin.logo || "", Math.max(8, size - 2));
        const badge = pinBadgeSize(size);
        const check = pin.verified
          ? `<span style="position:absolute;right:-3px;bottom:-3px;width:${badge}px;height:${badge}px;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35))">${VERIFIED_STAR_HTML}</span>`
          : pin.kind === "city" && (pin.count || 0) > 1
            ? `<span style="position:absolute;right:-4px;bottom:-4px;min-width:${badge}px;height:${badge}px;padding:0 3px;border-radius:${Math.ceil(badge / 2)}px;background:#f7931a;color:#fff;font:700 ${Math.max(8, badge - 4)}px/${badge}px Ubuntu,sans-serif">${pin.count}</span>`
            : "";
        const ring = size < 14 ? 1 : 1.5;
        const icon = L.divIcon({
          className: "",
          html: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:#fff;box-shadow:0 0 0 ${ring}px #f7931a;display:flex;align-items:center;justify-content:center;overflow:visible">${face}${check}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const founding = pin.comm && (pin.comm.id === FOUNDING_UY.id || pin.comm.slug === FOUNDING_UY.slug);
        const z = founding ? 700 : pin.kind === "community" ? 400 : pin.kind === "city" ? 260 : pin.verified ? 280 : 200;
        const m = L.marker([pin.lat, pin.lon], { icon, zIndexOffset: z });
        m.on("click", (ev) => {
          L.DomEvent.stopPropagation(ev);
          setDrop(null);
          setDropKind("pick");
          setVoteOpen(false);
          setFormErr("");
          if (pin.kind === "city") {
            map.setView([pin.lat0 ?? pin.lat, pin.lon0 ?? pin.lon], Math.max(12, zoom + 2), { animate: !prefersReducedMotion() });
            setSel(null);
            setSelComm(null);
            return;
          }
          if (pin.kind === "community" && pin.comm) {
            setSelComm(withFoundingProfile({ ...pin.comm, lat: pin.lat0, lon: pin.lon0 }));
            setSel(null);
          } else if (pin.place) {
            const stub = { ...pin.place, lat: pin.lat0, lon: pin.lon0, logo: pin.logo };
            setSel(stub);
            setSelComm(null);
            setDraft(store[pin.id]?.description || "");
            if (!pin.place.id.startsWith("cluster:") && !pin.place.id.startsWith("local:")) {
              void getMerchant({ data: { id: pin.id } }).then((full) => {
                if (!full) return;
                setSel({ ...full, lat: pin.lat0, lon: pin.lon0, logo: pin.logo || full.logo });
              });
            }
          }
        });
        const logo = escapeHtml(imgSrc(pin.logo || "")).replace(/"/g, "");
        const kind = refineShopIcon(pin.place?.category || "", pin.name);
        const clusterN = pin.count || 1;
        const title =
          pin.kind === "city"
            ? escapeHtml(t("mapCluster", { n: clusterN }))
            : escapeHtml(pin.name);
        const sub =
          pin.kind === "community"
            ? `@${escapeHtml(pin.slug || pin.id)}`
            : pin.kind === "city"
              ? ""
              : kind && kind !== "shop"
                ? escapeHtml(kind)
                : "";
        const tip = `<div style="display:flex;gap:8px;align-items:center;min-width:140px">
          ${logo ? `<img src="${logo}" alt="" width="32" height="32" referrerpolicy="no-referrer" style="border-radius:50%;object-fit:cover" onerror="this.remove()" />` : ""}
          <div><strong>${title}</strong>${sub ? `<br/><span style="opacity:.7">${sub}</span>` : ""}</div>
        </div>`;
        m.bindTooltip(tip, { direction: "top", sticky: true, opacity: 1 });
        m.addTo(group);
      }
      for (const s of STATUES) {
        const size = coinPinSize(zoom, "community", focus?.id === s.id);
        const face = coinFaceHtml(s.img, Math.max(8, size - 2));
        const ring = size < 14 ? 1 : 1.5;
        const icon = L.divIcon({
          className: "",
          html: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:#f7931a;box-shadow:0 0 0 ${ring}px #f7931a;overflow:hidden">${face}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const photo = escapeHtml(s.img);
        const card = `<div style="max-width:180px">
          <img src="${photo}" alt="" width="160" height="160" style="width:100%;height:auto;border-radius:8px;background:#f7931a;display:block" />
          <strong>${escapeHtml(t(s.nameKey))}</strong><br/>
          <span>${escapeHtml(t(s.whereKey))}</span><br/>
          <span>${escapeHtml(t(s.aboutKey))}</span><br/>
          <span style="opacity:.7">${escapeHtml(t(s.creditKey))}</span>
        </div>`;
        const sm = L.marker([s.lat, s.lon], { icon, zIndexOffset: 650 });
        sm.bindPopup(card, { maxWidth: 200 });
        if (focus?.id === s.id) sm.openPopup();
        sm.addTo(group);
      }
    } catch {
      /* un pin malo no deja el mapa en blanco */
    }
  }, [places, store, visibleComms, hit, mapReady, zoom, t, focus?.id]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    if (hitMark.current) {
      map.removeLayer(hitMark.current);
      hitMark.current = null;
    }
    if (!hit) return;
      const glyph = hit.kind === "community" ? "₿" : hit.kind === "city" ? "●" : "₿";
      const icon = L.divIcon({
        className: "",
        html: `<div class="bitacora-hit" role="img" aria-label="${escapeHtml(hit.label)}">
          <span class="bitacora-hit-pulse"></span>
          <span class="bitacora-hit-head">${glyph}</span>
          <span class="bitacora-hit-point"></span>
        </div>`,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
      });
      const marker = L.marker([hit.lat, hit.lon], { icon, zIndexOffset: 800, interactive: false });
      marker.bindPopup(`<strong>${escapeHtml(hit.label)}</strong><br/><span>${escapeHtml(hit.hint)}</span>`, {
        closeButton: false,
        offset: [0, -36],
      });
      marker.addTo(map);
      marker.openPopup();
      hitMark.current = marker;
  }, [hit]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!mapReady || !map || !L) return;
    if (dropMark.current) {
      map.removeLayer(dropMark.current);
      dropMark.current = null;
    }
    if (!drop) return;
    const label = addrHit ? formatStreet(addrHit, lang) : t("newPoint");
    const icon = L.divIcon({
      className: "",
      html: `<div class="bitacora-hit" role="img" aria-label="${escapeHtml(label)}">
        <span class="bitacora-hit-pulse"></span>
        <span class="bitacora-hit-head">₿</span>
        <span class="bitacora-hit-point"></span>
      </div>`,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
    });
    const marker = L.marker([drop.lat, drop.lon], { icon, zIndexOffset: 850 });
    marker.on("click", (ev) => L.DomEvent.stopPropagation(ev));
    if (addrHit) {
      marker.bindPopup(`<strong>${escapeHtml(label)}</strong>`, { closeButton: false, offset: [0, -36] });
    }
    marker.addTo(map);
    dropMark.current = marker;
  }, [drop, addrHit, lang, mapReady, t]);

  useEffect(() => {
    clearRoute();
  }, [sel?.id, selComm?.id]);

  function flyTo(hit: SearchHit) {
    setHit(hit);
    mapRef.current?.setView([hit.lat, hit.lon], hit.kind === "city" ? 13 : 16, { animate: !prefersReducedMotion() });
    setDrop(null);
    setDropKind("pick");
    setVoteOpen(false);
    if (hit.kind === "community") {
      setSelComm(withFoundingProfile(hit.community));
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
    const csv = dumpMapCsv(nextStore, nextComms, places);
    writeExtra(CSV_CACHE, csv);
    return saveMapCsv({ data: { csv, captchaId: ticket?.id, captcha: ticket?.answer, captchaNonce: ticket?.nonce } }).then(
      (r) => {
        if (r.ok) setSync("on");
        else setSync("fail");
        void invalidate(csv);
        return r.ok;
      },
      () => {
        setSync("fail");
        return false;
      },
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
    if (!privacyOk) {
      setFormErr(t("privacyAcceptNeed"));
      return;
    }
    if (!captchaOk) {
      setFormErr(t("captchaNeed"));
      return;
    }
    const by = nick.trim() || "colaborador";
    writeExtra("bitacora-nick", by);
    const next = rateShopListing({ store, comms }, place, stars, nick, draft);
    setStore(next.store);
    void persist(next.store, next.comms).then((ok) => {
      if (!ok) setFormErr(t("voteSaveFail"));
      else {
        setFormErr("");
        setCaptchaOk(false);
        setDraft("");
        setVoteOpen(false);
      }
    });
  }

  function failCarga(code?: string) {
    if (code === "captcha") {
      setFormErr(t("captchaSlow"));
      setCaptchaOk(false);
    } else if (code === "rate") setFormErr(t("pinRate"));
    else if (code === "save") setFormErr(t("pinSaveFail"));
    else if (code === "pending") setFormErr(t("listingPending"));
    else if (code === "slugTaken") setFormErr(t("slugTaken"));
    else if (code === "slug") setFormErr(t("needSlug"));
    else if (code === "instagram") setFormErr(t("pinNoIg"));
    else if (code === "links" || code === "need") setFormErr(t("verifyNeedLink"));
    else if (code === "proof" || code === "token" || code === "live" || code === "missing") setFormErr(t("pinProofFail"));
    else setFormErr(t("pinNeed"));
  }

  function keepPendingMap(p: PendingCarga | null) {
    setPendingCarga(p);
    writePendingMap(p);
  }

  async function propose() {
    if (!privacyOk) {
      setFormErr(t("privacyAcceptNeed"));
      return;
    }
    if (!linkOk) {
      setFormErr(t("linkNeed"));
      return;
    }
    if (!drop || !shopName.trim()) {
      setFormErr(t("pinNeed"));
      return;
    }
    const pin = { lat: drop.lat, lon: drop.lon };
    const links = linksFromPicked(picked, handles);
    const cap = ticketRef.current;
    if (!cap) {
      setFormErr(t("captchaNeed"));
      return;
    }
    setCargaGenerating(true);
    setFormErr("");
    const started = Date.now();
    try {
      const res = await submitMapListing({
        data: {
          kind: "shop",
          name: shopName,
          description: shopDesc,
          notes: shopNotes,
          address: shopAddr,
          logo: shopLogo,
          lat: pin.lat,
          lon: pin.lon,
          socials: socialsToCsv(links),
          hours: hoursToCsv(shopHours),
          pays: paysToCsv(shopPays),
          captchaId: cap.id,
          captcha: cap.answer,
          captchaNonce: cap.nonce,
          consent: true,
          textVersion: LEGAL.consentVersion,
          form: "shop",
        },
      });
      await holdCargaSpinner(started);
      if (!res.ok || !res.id || !res.token) {
        failCarga(res.error);
        return;
      }
      const out = publishShop(
        { store, comms },
        pin,
        {
          name: shopName,
          description: shopDesc,
          notes: shopNotes,
          hours: shopHours,
          pays: shopPays,
          address: shopAddr,
          logo: shopLogo,
          links,
          stars,
          nick,
        },
      );
      if (!out.ok) {
        setFormErr(t("fldName"));
        return;
      }
      const local = { ...out.local, verifyToken: res.token, verifiedAt: 0 };
      const place = { ...out.place, id: res.id };
      const nextStore = { ...out.bundle.store, [res.id]: local };
      setStore(nextStore);
      saveStore(nextStore);
      keepPendingMap({
        kind: "shop",
        id: res.id,
        token: res.token,
        name: shopName.trim(),
        lat: pin.lat,
        lon: pin.lon,
        created: Date.now(),
      });
      // El listado queda pendiente: no volver al globo ni perder el paso «Ya cargué la prueba».
      lockWorldRef.current = true;
      stayOnMap(pin.lat, pin.lon);
      setSel(place);
      setSelComm(null);
      setDrop(null);
      setDropKind("pick");
      setVoteOpen(false);
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
      keepTicket(null);
      setFormErr("");
    } catch {
      failCarga("save");
    } finally {
      setCargaGenerating(false);
    }
  }

  async function saveCommunity() {
    if (!drop) return; // el pin del mapa es el ancla; sin pin no hay carga
    if (!form.name.trim()) {
      setFormErr(t("pinNeed"));
      return;
    }
    if (!privacyOk) {
      setFormErr(t("privacyAcceptNeed"));
      return;
    }
    const cap = ticketRef.current;
    if (!cap) {
      setFormErr(t("captchaNeed"));
      return;
    }
    const links = linksFromPicked(picked, handles);
    setCargaGenerating(true);
    setFormErr("");
    const started = Date.now();
    try {
      const res = await submitMapListing({
        data: {
          kind: "community",
          name: form.name,
          slug: form.slug,
          description: form.description,
          logo: form.logo,
          lat: drop.lat,
          lon: drop.lon,
          socials: socialsToCsv(links),
          captchaId: cap.id,
          captcha: cap.answer,
          captchaNonce: cap.nonce,
          consent: true,
          textVersion: LEGAL.consentVersion,
          form: "community",
        },
      });
      await holdCargaSpinner(started);
      if (!res.ok || !res.id || !res.token) {
        failCarga(res.error);
        return;
      }
      const out = publishCommunity(
        { store, comms },
        drop,
        {
          slug: form.slug,
          name: form.name,
          description: form.description,
          logo: form.logo,
          links,
        },
      );
      const row = out.ok
        ? { ...out.row, id: res.id, verifyToken: res.token, verifiedAt: 0 }
        : {
            id: res.id,
            slug: res.id.replace(/^c:/, ""),
            name: form.name.trim() || res.id,
            lat: drop.lat,
            lon: drop.lon,
            logo: form.logo,
            description: form.description,
            links,
            createdAt: Date.now(),
            verifyToken: res.token,
            verifiedAt: 0,
          };
      const nextComms = [...comms.filter((c) => c.id !== row.id), row];
      setComms(nextComms);
      saveCommunities(nextComms);
      keepPendingMap({
        kind: "community",
        id: res.id,
        token: res.token,
        name: row.name,
        lat: drop.lat,
        lon: drop.lon,
        slug: row.slug,
        created: Date.now(),
      });
      lockWorldRef.current = true;
      stayOnMap(drop.lat, drop.lon);
      setSelComm(row);
      setSel(null);
      setDrop(null);
      setDropKind("pick");
      setVoteOpen(false);
      setForm(EMPTY_COMM_FORM);
      setPicked([]);
      setHandles({});
      setCaptchaOk(false);
      keepTicket(null);
      setFormErr("");
    } catch {
      failCarga("save");
    } finally {
      setCargaGenerating(false);
    }
  }

  function voteCommunity(c: Community) {
    if (!privacyOk) {
      setFormErr(t("privacyAcceptNeed"));
      return;
    }
    if (!captchaOk) {
      setFormErr(t("captchaNeed"));
      return;
    }
    const by = nick.trim() || "colaborador";
    writeExtra("bitacora-nick", by);
    const out = rateCommunityListing({ store, comms }, c, stars, nick);
    setComms(out.bundle.comms);
    setSelComm(out.row);
    void persist(out.bundle.store, out.bundle.comms).then((ok) => {
      if (!ok) setFormErr(t("voteSaveFail"));
      else {
        setFormErr("");
        setCaptchaOk(false);
        setVoteOpen(false);
      }
    });
    void upsertCommunity(out.row).then(
      (ok) => {
        if (ok) setSync("on");
      },
      () => setSync("fail"),
    );
  }

  function pinFromAddress(hit: StreetHit) {
    if (hit.fromMap && drop) {
      // Calle de la manzana: se confirma la dirección y el pin no se mueve.
      const next = { ...hit, lat: drop.lat, lon: drop.lon, fromMap: true };
      setShopAddr(formatStreet(next, lang));
      setAddrHit(next);
      return;
    }
    const next = { ...hit, fromMap: undefined };
    // «Otra dirección»: el pin se mueve a esa calle y ahora sí hace falta altura.
    setDrop({ lat: hit.lat, lon: hit.lon });
    setDropKind((k) => (k === "comunidad" ? "comunidad" : "comercio"));
    setMode((m) => (m === "comunidad" ? "comunidad" : "comercio"));
    setShopAddr(formatStreet(next, lang));
    setAddrHit(next);
    stayOnMap(hit.lat, hit.lon);
  }

  function toggleSocial(k: SocialKey) {
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  function startJoin() {
    if (pendingCarga || cargaGenerating) return;
    const map = mapRef.current;
    const lat = map?.getCenter().lat ?? drop?.lat ?? focus?.lat;
    const lon = map?.getCenter().lng ?? drop?.lon ?? focus?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    setDrop({ lat: lat as number, lon: lon as number });
    setDropKind("pick");
    setSel(null);
    setSelComm(null);
    setVoteOpen(false);
    setFormErr("");
    stayOnMap(lat as number, lon as number, 16);
  }

  const startJoinRef = useRef(startJoin);
  startJoinRef.current = startJoin;
  useEffect(() => onJoinMap(() => startJoinRef.current()), []);

  function cancelDrop() {
    setDrop(null);
    setDropKind("pick");
    setFormErr("");
    setCaptchaOk(false);
    setPrivacyOk(false);
    setLinkOk(false);
    setShopName("");
    setShopDesc("");
    setShopNotes("");
    setShopHours(EMPTY_HOURS);
    setShopPays([]);
    setShopAddr("");
    setAddrHit(null);
    setShopLogo("");
    setForm(EMPTY_COMM_FORM);
    setPicked([]);
    setHandles({});
  }

  function cancelSel() {
    if (pendingCarga) return; // hay que validar o cancelar el CARGA, no descartar el pin
    clearRoute();
    setSel(null);
    setSelComm(null);
    setVoteOpen(false);
    setPatchOpen(false);
    setFormErr("");
    setCaptchaOk(false);
    setPrivacyOk(false);
    setLinkOk(false);
    setDraft("");
    setDrop(null);
    setDropKind("pick");
  }

  function abortPending() {
    const pending = pendingCarga;
    if (pending) void cancelMapListing({ data: { id: pending.id, token: pending.token } });
    if (pending?.kind === "shop") {
      const next = { ...store };
      delete next[pending.id];
      setStore(next);
      saveStore(next);
    } else if (pending?.kind === "community") {
      const next = comms.filter((c) => c.id !== pending.id);
      setComms(next);
      saveCommunities(next);
    }
    keepPendingMap(null);
    setSel(null);
    setSelComm(null);
    setFormErr("");
    setCargaBusy(false);
  }

  async function checkPending(proof: string) {
    if (!pendingCarga) return;
    setCargaBusy(true);
    setFormErr("");
    try {
      const res = await verifyMapListing({
        data: { id: pendingCarga.id, token: pendingCarga.token, proof },
      });
      if (!res.ok) {
        failCarga(res.error);
        return;
      }
      if (pendingCarga.kind === "community") {
        const next = comms.map((c) => (c.id === pendingCarga.id ? { ...c, verifiedAt: Date.now() } : c));
        setComms(next);
        saveCommunities(next);
        setSelComm(next.find((c) => c.id === pendingCarga.id) || null);
      } else {
        const prev = store[pendingCarga.id];
        if (prev) {
          const next = { ...store, [pendingCarga.id]: { ...prev, verifiedAt: Date.now() } };
          setStore(next);
          saveStore(next);
        }
      }
      keepPendingMap(null);
      setFormErr("");
      void invalidate();
    } catch {
      failCarga("proof");
    } finally {
      setCargaBusy(false);
    }
  }

  const local = sel ? store[sel.id] : undefined;
  const removable = sel ? canRemove(local) : false;
  const chips: ("todas" | "comercios" | "comunidades")[] = ["todas", "comercios", "comunidades"];
  const _hasPin = Boolean(sel || selComm || pendingCarga);

  const body = (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display flex items-center gap-[0.28em] text-xl font-medium tracking-tight text-foreground sm:text-4xl">
          <span>
            {t("mapTitle")} {t("mapOf")}
          </span>
          <BitcoinMark className="h-[0.9em] w-[0.9em] shrink-0" />
        </h2>
        </div>
        <p className="text-sm text-pretty text-muted-foreground sm:text-base">{t("mapLead")}</p>
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
            <span className="font-semibold text-foreground">{globe.data.world.cities.toLocaleString()}</span> {t("globeCities")} ·{" "}
            <span className="font-semibold text-foreground">{globe.data.world.shops.toLocaleString()}</span> {t("globeShops")} ·{" "}
            <span className="font-semibold text-foreground">{globe.data.world.comms.toLocaleString()}</span> {t("globeComms")} ·{" "}
            <span className="font-semibold text-foreground">{globe.data.world.events.toLocaleString()}</span> {t("globeEvents")}
            {" · "}
            {t("globeFed")}
            <br />
            <span className="font-semibold text-primary">{t("globeLatamName")}</span>
            {": "}
            <span className="font-semibold text-foreground">{(globe.data.latam ?? globe.data.world).cities.toLocaleString()}</span> {t("globeCities")} ·{" "}
            <span className="font-semibold text-foreground">{(globe.data.latam ?? globe.data.world).shops.toLocaleString()}</span> {t("globeShops")} ·{" "}
            <span className="font-semibold text-foreground">{(globe.data.latam ?? globe.data.world).comms.toLocaleString()}</span> {t("globeComms")} ·{" "}
            <span className="font-semibold text-foreground">{(globe.data.latam ?? globe.data.world).events.toLocaleString()}</span> {t("globeEvents")}
          </p>
        ) : null}
        <p className={cn("text-xs", sync === "fail" ? "text-primary" : "text-muted-foreground")}>
          {sync === "on" ? t("mapCsvOn") : sync === "wait" ? t("mapSyncWait") : sync === "fail" ? t("mapSyncFail") : t("mapSyncOff")}
        </p>
        <div className="chip-row">
          {chips.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "chip font-mono",
                filter === k ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground",
              )}
            >
              {k === "todas" ? t("all") : k === "comercios" ? t("filterShops") : t("communities")}
            </button>
          ))}
        </div>
      </section>

      <div className="relative grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_320px]">
        <div className="isolate overflow-hidden rounded-lg bg-card shadow-[var(--shadow-border)]">
          <div className="relative">
          <div className="absolute top-3 right-3 left-3 z-[1500] max-w-lg">
            <MapSearch communities={allComms} places={places} onPick={flyTo} />
          </div>
          <div
            ref={mapEl}
            tabIndex={0}
            title={t("zoomNeedFocus")}
            className="bit-globe"
          />
          {geoBannerKey(geo) ? (
            <p className="pointer-events-none absolute bottom-2 left-3 z-[1500] max-w-[16rem] rounded-md bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-[var(--shadow-border)]">
              {t(geoBannerKey(geo)!)}
            </p>
          ) : null}
          </div>
          {geoNotice ? <p className="px-3 pt-2 text-center text-xs text-pretty text-muted-foreground">{t("geoPurpose")}</p> : null}
          <div className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto border-t border-border px-3 py-2 sm:grid sm:grid-cols-3 sm:overflow-visible">
            <button
              type="button"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-white sm:justify-self-start"
              aria-label={geo === "timeout" || geo === "unavailable" || geo === "denied" ? t("geoRetry") : t("geoAsk")}
              title={geo === "timeout" || geo === "unavailable" || geo === "denied" ? t("geoRetry") : t("geoAsk")}
              onClick={(ev) => {
                ev.stopPropagation();
                if (!geoNotice) {
                  setGeoNotice(true);
                  return;
                }
                setGeoNotice(false);
                void goToUser(true);
              }}
            >
              <Locate className="size-4 text-white" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              className="h-9 shrink-0 whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-50"
              onClick={(ev) => {
                ev.stopPropagation();
                startJoin();
              }}
              disabled={Boolean(pendingCarga || cargaGenerating)}
            >
              {t("globeJoin")}
            </button>
            {onWorld ? (
              <button
                type="button"
                className="h-9 shrink-0 whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-50 sm:justify-self-end"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onWorld();
                }}
                disabled={Boolean(pendingCarga || cargaGenerating)}
                title={pendingCarga ? t("listingPending") : t("globeBack")}
              >
                {t("globeBack")}
              </button>
            ) : (
              <span className="hidden sm:block" />
            )}
          </div>
        </div>

        <aside
          className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)]"
          aria-hidden={Boolean(pendingCarga || cargaGenerating) || undefined}
        >
          {pendingCarga || cargaGenerating ? (
            <CargaPendingView
              generating={cargaGenerating}
              token={pendingCarga?.token}
              name={pendingCarga?.name}
              busy={cargaBusy}
              err={formErr}
              onCheck={(proof) => void checkPending(proof)}
              onCancel={abortPending}
            />
          ) : selComm ? (
            <div className="space-y-3">
              <CommunityCard
                community={selComm}
                onVerified={() => {
                  const next = comms.map((c) => (c.id === selComm.id ? { ...c, verifiedAt: Date.now() } : c));
                  setComms(next);
                  saveCommunities(next);
                  keepPendingMap(null);
                  void invalidate();
                }}
                onPatched={() => void invalidate()}
              />
              <StarMeter score={selComm.score ?? 0} votes={selComm.voteCount ?? selComm.votes?.length ?? 0} />
              {patchOpen ? (
                <ListingPatchForm
                  listingId={selComm.id}
                  name={selComm.name}
                  description={selComm.description}
                  logo={selComm.logo}
                  lat={selComm.lat}
                  lon={selComm.lon}
                  isCommunity
                  onApplied={() => void invalidate()}
                  onClose={() => setPatchOpen(false)}
                />
              ) : (
              <MapVotePanel
                open={voteOpen}
                captchaKey={selComm.id}
                privacyId="privacy-map-vote-comm"
                nick={nick}
                onNick={setNick}
                stars={stars}
                onStars={setStars}
                captchaOk={captchaOk}
                onCaptcha={setCaptchaOk}
                onTicket={setTicket}
                privacyOk={privacyOk}
                onPrivacy={setPrivacyOk}
                err={formErr}
                onPublish={() => voteCommunity(selComm)}
                onGo={() => startGuide({ lat: selComm.lat, lon: selComm.lon })}
                going={guideWait}
                onPatch={() => {
                  setPatchOpen(true);
                  setVoteOpen(false);
                  setFormErr("");
                }}
                onOpen={() => {
                  setVoteOpen(true);
                  setPatchOpen(false);
                  setFormErr("");
                }}
                onHide={() => setVoteOpen(false)}
                onDismiss={cancelSel}
              />
              )}
              {guideErr ? <p className="text-sm text-pretty text-muted-foreground">{guideErr}</p> : null}
              {guideSteps.length ? (
                <ol className="max-h-56 space-y-1 overflow-auto text-sm">
                  <li className="font-medium text-foreground">{t("irSteps")}</li>
                  {guideSteps.map((s, i) => (
                    <li key={`${s.lat}-${s.lon}-${i}`}>
                      <button
                        type="button"
                        className="w-full rounded-md px-1 py-1 text-left text-pretty hover:bg-elevated"
                        onClick={() => mapRef.current?.setView([s.lat, s.lon], 17, { animate: !prefersReducedMotion() })}
                      >
                        <span>{formatGuideStep(s, lang)}</span>
                        {s.distance > 0 ? (
                          <span className="text-muted-foreground"> · {formatGuideMeters(s.distance, lang)}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : sel ? (
            <div className="space-y-3">
              <PlaceCard
                place={sel}
                local={local}
                removable={removable}
                onRemove={() => commit(sel.id, { ...(local as MerchantLocal), removed: true })}
                onVerified={() => {
                  if (!local) return;
                  const next = { ...store, [sel.id]: { ...local, verifiedAt: Date.now() } };
                  setStore(next);
                  saveStore(next);
                  keepPendingMap(null);
                  void invalidate();
                }}
                onPatched={() => void invalidate()}
              />
              {patchOpen ? (
                <ListingPatchForm
                  listingId={sel.id}
                  name={sel.name}
                  description={local?.description || sel.description}
                  address={local?.address}
                  notes={local?.notes}
                  logo={local?.logo || sel.logo}
                  hours={local?.hours}
                  pays={local?.pays}
                  links={local?.links}
                  lat={sel.lat}
                  lon={sel.lon}
                  onApplied={() => void invalidate()}
                  onClose={() => setPatchOpen(false)}
                />
              ) : (
              <MapVotePanel
                open={voteOpen}
                captchaKey={sel.id}
                privacyId="privacy-map-vote-shop"
                nick={nick}
                onNick={setNick}
                stars={stars}
                onStars={setStars}
                draft={draft}
                onDraft={setDraft}
                captchaOk={captchaOk}
                onCaptcha={setCaptchaOk}
                onTicket={setTicket}
                privacyOk={privacyOk}
                onPrivacy={setPrivacyOk}
                err={formErr}
                onPublish={() => vote(sel)}
                onGo={() => startGuide({ lat: sel.lat, lon: sel.lon })}
                going={guideWait}
                onPatch={() => {
                  setPatchOpen(true);
                  setVoteOpen(false);
                  setFormErr("");
                }}
                onOpen={() => {
                  setVoteOpen(true);
                  setPatchOpen(false);
                  setFormErr("");
                }}
                onHide={() => setVoteOpen(false)}
                onDismiss={cancelSel}
              />
              )}
              {guideErr ? <p className="text-sm text-pretty text-muted-foreground">{guideErr}</p> : null}
              {guideSteps.length ? (
                <ol className="max-h-56 space-y-1 overflow-auto text-sm">
                  <li className="font-medium text-foreground">{t("irSteps")}</li>
                  {guideSteps.map((s, i) => (
                    <li key={`${s.lat}-${s.lon}-${i}`}>
                      <button
                        type="button"
                        className="w-full rounded-md px-1 py-1 text-left text-pretty hover:bg-elevated"
                        onClick={() => mapRef.current?.setView([s.lat, s.lon], 17, { animate: !prefersReducedMotion() })}
                      >
                        <span>{formatGuideStep(s, lang)}</span>
                        {s.distance > 0 ? (
                          <span className="text-muted-foreground"> · {formatGuideMeters(s.distance, lang)}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : drop && dropKind === "pick" ? (
            <MapDropPick
              onShop={() => {
                setDropKind("comercio");
                setMode("comercio");
                setFormErr("");
              }}
              onComm={() => {
                setDropKind("comunidad");
                setMode("comunidad");
                setFormErr("");
              }}
              onCancel={cancelDrop}
            />
          ) : drop ? (
            <div className="space-y-3">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {dropKind === "comunidad" || mode === "comunidad" ? t("mapLoadComm") : t("mapLoadShop")}
              </p>
              <MapComposeForm
                kind={dropKind === "comunidad" || mode === "comunidad" ? "comunidad" : "comercio"}
                lang={lang}
                shopName={shopName}
                shopDesc={shopDesc}
                shopNotes={shopNotes}
                shopHours={shopHours}
                shopPays={shopPays}
                shopAddr={shopAddr}
                addrHit={addrHit}
                near={drop}
                shopLogo={shopLogo}
                form={form}
                picked={picked}
                handles={handles}
                captchaOk={captchaOk}
                privacyOk={privacyOk}
                linkOk={linkOk}
                formErr={formErr}
                onShopName={setShopName}
                onShopDesc={setShopDesc}
                onShopNotes={setShopNotes}
                onShopHours={setShopHours}
                onShopPays={setShopPays}
                onShopAddr={setShopAddr}
                onAddrHit={setAddrHit}
                onShopLogo={setShopLogo}
                onForm={setForm}
                onToggleSocial={toggleSocial}
                onHandle={(k, v) => setHandles((h) => ({ ...h, [k]: v }))}
                onCaptcha={setCaptchaOk}
                onTicket={keepTicket}
                onPrivacy={setPrivacyOk}
                onPickAddress={pinFromAddress}
                onPublish={dropKind === "comunidad" || mode === "comunidad" ? saveCommunity : propose}
                onCancel={cancelDrop}
                shopGate={
                  dropKind === "comunidad" || mode === "comunidad" ? null : (
                    <label htmlFor="shop-link" className="flex items-start gap-2 text-sm text-pretty text-foreground">
                      <input
                        id="shop-link"
                        type="checkbox"
                        className="mt-1 size-4 shrink-0 accent-primary"
                        checked={linkOk}
                        aria-required="true"
                        aria-invalid={formErr === t("linkNeed") ? true : undefined}
                        required
                        onChange={(e) => setLinkOk(e.target.checked)}
                      />
                      <span>{t("consentLink")}</span>
                    </label>
                  )
                }
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("pickSpot")}</p>
          )}
        </aside>
        {pendingCarga || cargaGenerating ? (
          <div
            className="absolute inset-0 z-[4000] flex items-start justify-center overflow-auto bg-background/90 p-3 pt-8 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="carga-proof-title"
          >
            <div
              ref={proofRef}
              id="carga-proof"
              tabIndex={-1}
              className="w-full max-w-md rounded-lg bg-card p-4 shadow-[var(--shadow-border)] outline-none sm:p-5"
            >
              <p id="carga-proof-title" className="text-sm font-medium text-foreground">
                {t("pinFormTitle")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("composeHow")}</p>
              <div className="mt-4">
                <CargaPendingView
                  generating={cargaGenerating}
                  token={pendingCarga?.token}
                  name={pendingCarga?.name}
                  busy={cargaBusy}
                  err={formErr}
                  onCheck={(proof) => void checkPending(proof)}
                  onCancel={abortPending}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <section className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)]" aria-labelledby="map-list-title">
        <h2 id="map-list-title" className="text-sm font-medium text-foreground">
          {t("mapListTitle")} ({visibleComms.length + Math.min(places.length, 80)})
        </h2>
        <ul className="mt-3 columns-1 gap-x-6 text-sm sm:columns-2">
          {visibleComms.map((c) => (
            <li key={`c-${c.id}`} className="break-inside-avoid py-0.5">
              <button
                type="button"
                className="text-left text-foreground underline-offset-2 hover:underline"
                onClick={() => {
                  setSelComm(withFoundingProfile(c));
                  setSel(null);
                  setVoteOpen(false);
                  setDrop(null);
                }}
              >
                {c.name}
              </button>
              <span className="text-muted-foreground"> · {c.slug}</span>
            </li>
          ))}
          {places.slice(0, 80).map((p) => (
            <li key={`p-${p.id}`} className="break-inside-avoid py-0.5">
              <button
                type="button"
                className="text-left text-foreground underline-offset-2 hover:underline"
                onClick={() => {
                  setSel(p);
                  setSelComm(null);
                  setVoteOpen(false);
                  setDrop(null);
                  setDraft(store[p.id]?.description || "");
                  if (!p.id.startsWith("cluster:") && !p.id.startsWith("local:")) {
                    void getMerchant({ data: { id: p.id } }).then((full) => {
                      if (full) setSel(full);
                    });
                  }
                }}
              >
                {p.name}
              </button>
              {p.category && p.category !== "other" && p.category !== "lugar" && p.category !== "cluster" ? (
                <span className="text-muted-foreground"> · {p.category}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

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
    </div>
  );
  return embedded ? body : <SiteShell>{body}</SiteShell>;
}

