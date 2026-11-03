import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { STATUES, statueGlow } from "@/domain/statues";
import { FOUNDING_UY, type GlobeFocus } from "@/domain/globe";
import { capitalOf } from "@/domain/capitals";
import { mapKeys, useGlobeStats } from "@/lib/map-query";
import { localeTag } from "@/lib/display";
import { useAppLang, useT } from "@/lib/i18n";
import { usePrefersReducedMotion } from "@/lib/motion";
import { BITCOIN_MARK_SVG } from "@/components/dashboard/brand-mark";
import { imgSrc } from "@/domain/map-csv";
import { dedupeCommunities, layoutCityLogos } from "@/domain/community-dedupe";
import { globeCoinSize } from "@/domain/map-pin-size";
import { ClientOnly } from "@/components/dashboard/client-only";
import { boxAround } from "@/domain";
import { getCityFrame } from "@/infrastructure/server-fns";
import { locateBest } from "@/infrastructure/geo";
import { hasWebGL } from "@/lib/webgl";
import { globeAntialias, slowNet } from "@/lib/net";

const GEO_URL = "/data/ne-110m-countries.json";

const WHITE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

type Feat = {
  type: "Feature";
  iso: string;
  geometry: { type?: string; coordinates?: unknown };
  shops: number;
  comms: number;
  events: number;
  cities: number;
};

function facesCamera(lat: number, lon: number, pov: { lat?: number; lng?: number; altitude?: number }) {
  const phi = (deg: number) => ((90 - deg) * Math.PI) / 180;
  const vec = (la: number, lo: number) => {
    const p = phi(la);
    const t = phi(lo);
    const s = Math.sin(p);
    return { x: s * Math.cos(t), y: Math.cos(p), z: s * Math.sin(t) };
  };
  const a = vec(lat, lon);
  const c = vec(Number(pov.lat) || 0, Number(pov.lng) || 0);
  const dot = a.x * c.x + a.y * c.y + a.z * c.z;
  const alt = Number(pov.altitude);
  const limb = 1 / (1 + (Number.isFinite(alt) ? alt : 1.5));
  return dot > limb + 0.04;
}

function featCenter(g: Feat["geometry"]) {
  let ring: number[][] = [];
  if (g.type === "Polygon") ring = ((g.coordinates as number[][][]) || [])[0] || [];
  else if (g.type === "MultiPolygon") ring = ((g.coordinates as number[][][][]) || [])[0]?.[0] || [];
  let x = 0;
  let y = 0;
  let n = 0;
  for (const p of ring) {
    x += Number(p[0]);
    y += Number(p[1]);
    n++;
  }
  return { lon: n ? x / n : 0, lat: n ? y / n : 0 };
}

function geoBox(g: Feat["geometry"]) {
  let minLon = 180;
  let maxLon = -180;
  let minLat = 90;
  let maxLat = -90;
  let n = 0;
  const walk = (c: unknown) => {
    if (!Array.isArray(c)) return;
    if (typeof c[0] === "number" && typeof c[1] === "number") {
      const lon = c[0];
      const lat = c[1];
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      n += 1;
      return;
    }
    for (const part of c) walk(part);
  };
  walk(g.coordinates);
  if (!n) return null;
  return { minLon, maxLon, minLat, maxLat };
}

function inGeoBox(
  lat: number,
  lon: number,
  box: { minLon: number; maxLon: number; minLat: number; maxLat: number },
  pad: number,
) {
  return lat >= box.minLat - pad && lat <= box.maxLat + pad && lon >= box.minLon - pad && lon <= box.maxLon + pad;
}

function zoomForBox(box: { minLon: number; maxLon: number; minLat: number; maxLat: number }) {
  const span = Math.max(box.maxLat - box.minLat, box.maxLon - box.minLon);
  if (span < 6) return 7;
  if (span < 14) return 5;
  if (span < 30) return 4;
  return 3;
}

function isoOf(props: Record<string, unknown>) {
  const a2 = String(props.ISO_A2 || "");
  if (a2 && a2 !== "-99") return a2;
  const eh = String(props.ISO_A2_EH || "");
  if (eh && eh !== "-99") return eh;
  return "";
}

function GlobeCanvas({
  onEnter,
  onSkip,
}: {
  onEnter: (focus: GlobeFocus) => void;
  onSkip: () => void;
}) {
  const t = useT();
  const lang = useAppLang();
  const reduceMotion = usePrefersReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const globeRef = useRef<{
    controls: () => {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableZoom: boolean;
      enableRotate: boolean;
      addEventListener: (type: string, cb: () => void) => void;
    };
    pointOfView: (pov?: { lat?: number; lng?: number; altitude?: number }, ms?: number) => { lat: number; lng: number; altitude: number };
    getScreenCoords?: (lat: number, lng: number, altitude?: number) => { x: number; y: number };
    toGlobeCoords?: (x: number, y: number) => { lat: number; lng: number } | null;
  } | null>(null);
  const entered = useRef(false);
  const drag = useRef({ x: 0, y: 0, moved: false });
  const [Globe, setGlobe] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [joining, setJoining] = useState(false);
  const [geoNotice, setGeoNotice] = useState(false);
  const [size, setSize] = useState({ w: 360, h: 360 });
  const [hover, setHover] = useState<Feat | null>(null);
  const [alt, setAlt] = useState(2.05);

  const stats = useGlobeStats();
  const geo = useQuery({
    queryKey: [...mapKeys.geo, "uy10m"],
    queryFn: async () => {
      const [res, patchRes] = await Promise.all([fetch(GEO_URL), fetch("/data/ne-uy-10m.json")]);
      if (!res.ok) throw new Error("geo");
      const raw = (await res.json()) as { features: { properties: Record<string, unknown>; geometry: Feat["geometry"] }[] };
      if (patchRes.ok) {
        const patch = (await patchRes.json()) as { iso?: string; geometry?: Feat["geometry"] };
        if (patch.geometry) {
          for (const f of raw.features) {
            const iso = isoOf(f.properties || {});
            if (iso === "UY") {
              f.geometry = patch.geometry;
              break;
            }
          }
        }
      }
      return raw;
    },
    staleTime: 24 * 60 * 60_000,
  });

  const features = useMemo<Feat[]>(() => {
    const by = new Map((stats.data?.countries || []).map((c) => [c.iso, c]));
    const out: Feat[] = [];
    for (const f of geo.data?.features || []) {
      const iso = isoOf(f.properties || {});
      if (!iso) continue;
      const s = by.get(iso);
      out.push({
        type: "Feature",
        iso,
        geometry: f.geometry,
        shops: s?.shops ?? 0,
        comms: s?.comms ?? 0,
        events: s?.events ?? 0,
        cities: s?.cities ?? 0,
      });
    }
    return out;
  }, [geo.data, stats.data]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (document.activeElement === wrap.current) return;
    try {
      const c = g.controls();
      c.autoRotate = !reduceMotion;
      c.autoRotateSpeed = reduceMotion ? 0 : 0.4;
    } catch {
      /* still loading */
    }
  }, [reduceMotion, Globe]);

  useEffect(() => {
    if (!hasWebGL()) {
      setLoadErr("webgl");
      return;
    }
    let stop = false;
    void import("react-globe.gl")
      .then((m) => {
        const g = (m as { default?: unknown }).default ?? m;
        const Cmp = (g as { default?: unknown }).default ?? g;
        if (!stop) setGlobe(() => Cmp as ComponentType<Record<string, unknown>>);
      })
      .catch((err: Error) => {
        if (!stop) setLoadErr(err.message || "globe");
      });
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let t = 0;
    const apply = () => {
      const w = el.clientWidth || el.getBoundingClientRect().width;
      const h = el.clientHeight || el.getBoundingClientRect().height;
      const next = {
        w: Math.max(Math.floor(w) || 320, 220),
        h: h > 40 ? Math.floor(h) : 200,
      };
      setSize((s) => (Math.abs(s.w - next.w) < 8 && Math.abs(s.h - next.h) < 8 ? s : next));
    };
    apply();
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(apply, 160);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames([localeTag(lang)], { type: "region" });
    } catch {
      return null;
    }
  }, [lang]);

  function enter(lat: number, lon: number, zoom: number, iso?: string, pin?: { id?: string; kind?: "shop" | "community" }, join?: boolean) {
    if (entered.current) return;
    entered.current = true;
    onEnter({ lat, lon, zoom, iso, id: pin?.id, kind: pin?.kind, join });
  }

  function sphereAt(clientX: number, clientY: number) {
    const g = globeRef.current;
    const canvas = wrap.current?.querySelector("canvas");
    const rect = canvas?.getBoundingClientRect();
    if (!g?.toGlobeCoords || !rect || rect.width < 2) return null;
    const hit = g.toGlobeCoords(clientX - rect.left, clientY - rect.top);
    if (!hit || !Number.isFinite(hit.lat) || !Number.isFinite(hit.lng)) return null;
    return { lat: hit.lat, lon: hit.lng };
  }

  function enterCountry(d: Feat, coords?: { lat?: number; lng?: number }) {
    const box = geoBox(d.geometry);
    const lat = Number(coords?.lat);
    const lon = Number(coords?.lng);
    const zoom = box ? zoomForBox(box) : 6;
    if (box && Number.isFinite(lat) && Number.isFinite(lon) && inGeoBox(lat, lon, box, 1.2)) {
      enter(lat, lon, zoom, d.iso);
      return;
    }
    const cap = capitalOf(d.iso);
    if (cap && (!box || inGeoBox(cap.lat, cap.lon, box, 4))) {
      enter(cap.lat, cap.lon, zoom, d.iso);
      return;
    }
    if (box) {
      enter((box.minLat + box.maxLat) / 2, (box.minLon + box.maxLon) / 2, zoom, d.iso);
      return;
    }
    const c = featCenter(d.geometry);
    enter(c.lat, c.lon, zoom, d.iso);
  }

  function askJoin() {
    if (joining || entered.current) return;
    if (!geoNotice) {
      setGeoNotice(true);
      return;
    }
    void joinHere();
  }

  async function joinHere() {
    if (joining || entered.current) return;
    setJoining(true);
    try {
      const cityOf = (lat: number, lon: number, zoom: number) =>
        getCityFrame({ data: { lat, lon, zoom } }).catch(() => boxAround(lat, lon));
      let city;
      try {
        city = (await locateBest(true, cityOf)).city;
      } catch {
        city = (await locateBest(false, cityOf)).city;
      }
      enter(city.lat, city.lon, 16, city.countryCode, undefined, true);
    } catch {
      onSkip();
    } finally {
      setJoining(false);
    }
  }

  const world = stats.data?.world;
  const latam = stats.data?.latam ?? world;
  const mapPins = stats.data?.points || [];
  const overlayPins = stats.data?.overlay || [];
  const coinPins = useMemo(() => {
    const byId = new Map<string, (typeof mapPins)[number] & { name: string; id: string }>();
    for (const p of mapPins) {
      if (p.kind === "community" && p.id) byId.set(p.id, { ...p, id: p.id, name: p.name || p.id });
    }
    for (const p of overlayPins) {
      if (p.kind === "community" && p.id) {
        const prev = byId.get(p.id);
        byId.set(p.id, { ...p, id: p.id, name: p.name || prev?.name || p.id, logo: p.logo || prev?.logo });
      }
    }
    return layoutCityLogos(dedupeCommunities([...byId.values()]), 0.035);
  }, [mapPins, overlayPins]);

  const ownShops = useMemo(() => {
    const rows: { id: string; name: string; lat: number; lon: number; logo?: string }[] = [];
    for (const p of overlayPins) {
      if (p.kind === "shop" && p.id && Number.isFinite(p.lat) && Number.isFinite(p.lon)) {
        rows.push({ id: p.id, name: p.name || p.id, lat: p.lat, lon: p.lon, logo: p.logo });
      }
    }
    return layoutCityLogos(rows, 0.02);
  }, [overlayPins]);

  const far = alt > 1.48;
  const htmlPins = useMemo(() => {
    const pxFor = (id?: string) => globeCoinSize(alt, id === FOUNDING_UY.id);
    return [
      ...coinPins.map((p) => ({
        ...p,
        // La foto entra desde la primera vista. El ₿ solo queda si no hay logo.
        face: p.logo ? ("logo" as const) : ("btc" as const),
        px: pxFor(p.id),
      })),
      ...(!far ? ownShops.map((p) => ({ ...p, face: "logo" as const, kind: "shop" as const, px: pxFor(p.id) })) : []),
      ...STATUES.map((s) => ({
        id: s.id,
        name: t(s.nameKey),
        lat: s.lat,
        lon: s.lon,
        logo: s.img,
        face: "logo" as const,
        halo: true,
        px: pxFor(s.id) + 8,
      })),
    ];
  }, [coinPins, ownShops, far, alt, t]);

  const enterRef = useRef(enter);
  enterRef.current = enter;

  function pinUnder(clientX: number, clientY: number) {
    const g = globeRef.current;
    const root = wrap.current;
    if (!g || !root) return null;
    const pov = g.pointOfView?.() || { lat: -15, lng: -58, altitude: 2 };
    const buttons = root.querySelectorAll<HTMLButtonElement>("button[data-pin-lat]");
    let best: HTMLButtonElement | null = null;
    let bestD = Infinity;
    buttons.forEach((el) => {
      if (el.style.display === "none") return;
      const faceLat = Number(el.dataset.faceLat);
      const faceLon = Number(el.dataset.faceLon);
      if (!Number.isFinite(faceLat) || !Number.isFinite(faceLon) || !facesCamera(faceLat, faceLon, pov)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dist = Math.hypot(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2));
      const rad = Math.max(rect.width, rect.height) / 2 + 8;
      if (dist <= rad && dist < bestD) {
        best = el;
        bestD = dist;
      }
    });
    if (!best) return null;
    const lat = Number(best.dataset.pinLat);
    const lon = Number(best.dataset.pinLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const kind = best.dataset.pinKind === "shop" || best.dataset.pinKind === "community" ? best.dataset.pinKind : undefined;
    return { lat, lon, id: best.dataset.pinId || undefined, kind };
  }
  const htmlElement = useCallback(
    (d: { lat: number; lon: number; lat0?: number; lon0?: number; id?: string; name?: string; logo?: string; kind?: "shop" | "community"; face?: "btc" | "logo"; halo?: boolean; px?: number }) => {
      const el = document.createElement("button");
      const sizePx = d.px ?? globeCoinSize(2.35, d.id === FOUNDING_UY.id);
      const ring = sizePx < 14 ? 1 : 1.5;
      el.type = "button";
      el.tabIndex = -1;
      el.title = d.name || "";
      const pinLat = Number(d.lat0 ?? d.lat);
      const pinLon = Number(d.lon0 ?? d.lon);
      if (Number.isFinite(pinLat)) el.dataset.pinLat = String(pinLat);
      if (Number.isFinite(pinLon)) el.dataset.pinLon = String(pinLon);
      el.dataset.faceLat = String(d.lat);
      el.dataset.faceLon = String(d.lon);
      if (d.id) el.dataset.pinId = d.id;
      if (d.kind) el.dataset.pinKind = d.kind;
      const face = d.halo ? document.createElement("span") : null;
      if (d.halo && face) {
        const glow = statueGlow(sizePx);
        const box = sizePx + glow.pad * 2;
        el.style.cssText = `width:${box}px;height:${box}px;padding:0;border:0;border-radius:0;background:transparent;display:flex;align-items:center;justify-content:center;overflow:visible;pointer-events:none`;
        face.style.cssText = `display:block;width:${sizePx}px;height:${sizePx}px;border-radius:50%;overflow:hidden;background:#f7931a;box-shadow:${glow.shadow}`;
      } else {
        el.style.cssText = `width:${sizePx}px;height:${sizePx}px;padding:0;border:0;border-radius:50%;background:#fff;box-shadow:0 0 0 ${ring}px #f7931a;overflow:hidden;pointer-events:none`;
      }
      const host = face ?? el;
      const logo = d.face === "logo" ? imgSrc(d.logo || "") : "";
      if (logo) {
        const img = document.createElement("img");
        img.src = logo;
        img.alt = d.name || "";
        img.referrerPolicy = "no-referrer";
        img.decoding = "async";
        img.width = sizePx;
        img.height = sizePx;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;background:#f7931a";
        img.onerror = () => {
          host.innerHTML = BITCOIN_MARK_SVG;
        };
        host.appendChild(img);
      } else {
        host.innerHTML = BITCOIN_MARK_SVG;
      }
      if (face) el.appendChild(face);
      return el;
    },
    [],
  );

  return (
    <div className="globe-fit overflow-hidden rounded-lg bg-white shadow-[var(--shadow-border)]">
      <header className="shrink-0 px-2 py-2 sm:px-4 sm:py-3">
        <div className="mx-auto max-w-3xl rounded-lg bg-white/75 px-3 py-2 text-center shadow-[0_0_0_1px_rgba(29,29,27,0.12)] backdrop-blur-[2px] sm:px-5 sm:py-2.5">
        <p className="font-display text-sm text-neutral-900 sm:text-2xl">{t("globeKicker")}</p>
        <p className="hidden text-[11px] text-neutral-600 sm:mt-0.5 sm:block sm:text-sm">{t("globeTitle")}</p>
        {world ? (
          <>
          <ul className="mt-1.5 grid grid-cols-2 justify-items-center gap-x-2 gap-y-1 sm:mt-2 sm:grid-cols-4 sm:gap-x-6" aria-label={t("globeTitle")}>
            <li className="text-[11px] text-neutral-600 sm:text-sm">
              <span className="text-base font-bold text-neutral-900 sm:text-2xl">{world.cities.toLocaleString()}</span>
              <span className="ml-1 font-medium">{t("globeCitiesShort")}</span>
            </li>
            <li className="text-[11px] text-neutral-600 sm:text-sm">
              <span className="text-base font-bold text-neutral-900 sm:text-2xl">{world.shops.toLocaleString()}</span>
              <span className="ml-1 font-medium">{t("globeShops")}</span>
            </li>
            <li className="text-[11px] text-neutral-600 sm:text-sm">
              <span className="text-base font-bold text-neutral-900 sm:text-2xl">{world.comms.toLocaleString()}</span>
              <span className="ml-1 font-medium">{t("globeComms")}</span>
            </li>
            <li className="text-[11px] text-neutral-600 sm:text-sm">
              <span className="text-base font-bold text-neutral-900 sm:text-2xl">{world.events.toLocaleString()}</span>
              <span className="ml-1 font-medium">{t("globeEvents")}</span>
            </li>
          </ul>
          {latam ? (
            <p className="mt-1 flex flex-wrap items-baseline justify-center gap-x-1.5 text-[10px] text-neutral-600 sm:text-xs">
              <span className="font-semibold tracking-wide text-primary uppercase">{t("globeLatamName")}</span>
              <span>
                <span className="font-bold text-neutral-900">{latam.cities.toLocaleString()}</span> {t("globeCitiesShort")}
                {" · "}
                <span className="font-bold text-neutral-900">{latam.shops.toLocaleString()}</span> {t("globeShops")}
                {" · "}
                <span className="font-bold text-neutral-900">{latam.comms.toLocaleString()}</span> {t("globeComms")}
                {" · "}
                <span className="font-bold text-neutral-900">{latam.events.toLocaleString()}</span> {t("globeEvents")}
              </span>
            </p>
          ) : null}
          </>
        ) : null}
        </div>
      </header>

      <div
        ref={wrap}
        tabIndex={0}
        role="application"
        aria-label={t("globeKeys")}
        title={t("zoomNeedFocus")}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
          wrap.current?.focus({ preventScroll: true });
          const g = globeRef.current;
          if (!g) return;
          const c = g.controls();
          c.enableRotate = true;
          c.enableZoom = true;
        }}
        onPointerMove={(e) => {
          if (Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 6) drag.current.moved = true;
        }}
        onPointerUp={(e) => {
          if (drag.current.moved) return;
          const pin = pinUnder(e.clientX, e.clientY);
          if (!pin) return;
          const box = hover ? geoBox(hover.geometry) : null;
          if (box && !inGeoBox(pin.lat, pin.lon, box, 2)) return;
          const hit = sphereAt(e.clientX, e.clientY);
          if (hit && Math.hypot(pin.lat - hit.lat, pin.lon - hit.lon) > 6) return;
          enterRef.current(pin.lat, pin.lon, 14, hover?.iso, pin);
        }}
        onFocus={() => {
          const g = globeRef.current;
          if (!g) return;
          const c = g.controls();
          c.enableRotate = true;
          c.enableZoom = true;
        }}
        onBlur={(e) => {
          const next = e.relatedTarget;
          if (next instanceof Node && wrap.current?.contains(next)) return;
          const g = globeRef.current;
          if (!g) return;
          const c = g.controls();
          c.enableZoom = false;
          c.autoRotate = !reduceMotion;
        }}
        onKeyDown={(e) => {
          const g = globeRef.current;
          if (!g) return;
          const pov = g.pointOfView() || { lat: -15, lng: -58, altitude: alt };
          const turn = e.shiftKey ? 14 : 7;
          const z = e.shiftKey ? 0.28 : 0.14;
          const go = (next: { lat?: number; lng?: number; altitude?: number }) => {
            g.controls().autoRotate = false;
            g.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: pov.altitude, ...next }, 90);
          };
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            go({ lng: pov.lng - turn });
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            go({ lng: pov.lng + turn });
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            go({ lat: Math.min(80, pov.lat + turn) });
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            go({ lat: Math.max(-80, pov.lat - turn) });
          } else if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            go({ altitude: Math.max(0.35, pov.altitude - z) });
          } else if (e.key === "-" || e.key === "_") {
            e.preventDefault();
            go({ altitude: Math.min(4, pov.altitude + z) });
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (hover) enterCountry(hover);
            else onSkip();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onSkip();
          }
        }}
        className="bit-globe relative z-0 overflow-hidden bg-white outline-none focus-visible:shadow-[var(--shadow-border-hover)]"
      >
      {Globe ? (
        <Globe
          ref={globeRef}
          width={Math.max(size.w, 220)}
          height={Math.max(size.h, 200)}
          backgroundColor="#ffffff"
          globeImageUrl={WHITE}
          showAtmosphere={false}
          animateIn={false}
          rendererConfig={{
            antialias: globeAntialias(slowNet(), typeof window === "undefined" ? 1 : window.devicePixelRatio || 1),
            alpha: false,
            powerPreference: "default",
          }}
          polygonsData={features}
          polygonGeoJsonGeometry="geometry"
          polygonCapCurvatureResolution={4}
          polygonCapColor={(d: Feat) => {
            const on = d.shops + d.comms + d.events + d.cities > 0;
            if (hover?.iso === d.iso) return "rgba(247,147,26,0.55)";
            return on ? "rgba(247,147,26,0.4)" : "#f3f1ec";
          }}
          polygonSideColor={() => "rgba(29,29,27,0.45)"}
          polygonStrokeColor={() => "#1d1d1b"}
          polygonAltitude={(d: Feat) => {
            if (hover?.iso === d.iso) return 0.012;
            return d.shops + d.comms + d.events + d.cities > 0 ? 0.005 : 0.003;
          }}
          polygonsTransitionDuration={0}
          htmlElementsData={htmlPins}
          htmlLat="lat"
          htmlLng={(d: { lng?: number; lon?: number }) => d.lng ?? d.lon}
          htmlAltitude={(d: { halo?: boolean }) => (d.halo ? 0.03 : 0.008)}
          htmlTransitionDuration={0}
          htmlElement={htmlElement}
          pointsData={[]}
          onZoom={(pov: { altitude?: number }) => {
            const a = Number(pov?.altitude);
            if (!Number.isFinite(a)) return;
            setAlt((prev) => (Math.abs(prev - a) < 0.12 ? prev : a));
          }}
          onPolygonHover={(d: Feat | null) => setHover(d)}
          onPolygonClick={(d: Feat, _ev: unknown, coords?: { lat?: number; lng?: number }) => {
            if (entered.current) return;
            enterCountry(d, coords);
          }}
          onGlobeReady={() => {
            const g = globeRef.current;
            if (!g) return;
            const c = g.controls();
            c.autoRotate = !reduceMotion;
            c.autoRotateSpeed = reduceMotion ? 0 : 0.4;
            c.enableRotate = true;
            c.enableZoom = document.activeElement === wrap.current;
            const canvas = wrap.current?.querySelector("canvas");
            if (canvas) canvas.style.touchAction = "none";
            c.addEventListener("start", () => {
              c.autoRotate = false;
              c.enableRotate = true;
              c.enableZoom = true;
            });
            g.pointOfView({ lat: -15, lng: -58, altitude: 2.05 });
          }}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-neutral-500">{loadErr || geo.isError ? t("globeFail") : t("loading")}</p>
          {loadErr || geo.isError ? (
            <button type="button" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-white" onClick={onSkip}>
              {t("globeSkip")}
            </button>
          ) : null}
        </div>
      )}

      {hover ? (
        <div className="pointer-events-none absolute right-2 bottom-14 left-2 z-20 rounded-md bg-white/95 px-3 py-2 shadow-[var(--shadow-border)] sm:right-auto sm:bottom-4 sm:left-1/2 sm:w-[min(92%,320px)] sm:-translate-x-1/2">
          <p className="font-medium text-neutral-900">{names?.of(hover.iso) || hover.iso}</p>
          <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-xs text-neutral-700 sm:grid-cols-1 sm:text-sm">
            <li>
              {t("globeCities")}: <span className="font-bold text-primary">{hover.cities.toLocaleString()}</span>
            </li>
            <li>
              {t("globeShops")}: <span className="font-bold text-primary">{hover.shops.toLocaleString()}</span>
            </li>
            <li>
              {t("globeComms")}: <span className="font-bold text-primary">{hover.comms.toLocaleString()}</span>
            </li>
            <li>
              {t("globeEvents")}: <span className="font-bold text-primary">{hover.events.toLocaleString()}</span>
            </li>
          </ul>
        </div>
      ) : null}
      </div>
      {geoNotice ? <p className="px-3 pt-2 text-center text-xs text-pretty text-muted-foreground">{t("geoPurpose")}</p> : null}
      <div className="flex shrink-0 flex-nowrap items-center justify-center gap-2 overflow-x-auto border-t border-border px-3 py-2 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:overflow-visible">
        <span className="hidden sm:block" />
        <button
          type="button"
          className="h-9 shrink-0 whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-60"
          onClick={() => askJoin()}
          disabled={joining}
        >
          {joining ? t("geoWait") : t("globeJoin")}
        </button>
        <button
          type="button"
          className="h-9 shrink-0 whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-white sm:justify-self-end"
          onClick={onSkip}
        >
          {t("globeSkip")}
        </button>
      </div>
    </div>
  );
}

export function WorldGlobe({ onEnter, onSkip }: { onEnter: (focus: GlobeFocus) => void; onSkip: () => void }) {
  return (
    <ClientOnly fallback={<div className="bit-globe rounded-lg bg-white shadow-[var(--shadow-border)]" />}>
      <GlobeCanvas onEnter={onEnter} onSkip={onSkip} />
    </ClientOnly>
  );
}
