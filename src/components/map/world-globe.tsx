import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import type { GlobeFocus } from "@/domain/globe";
import { FOUNDING_UY } from "@/domain/globe";
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
    controls: () => { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean };
    pointOfView: () => { lat: number; lng: number; altitude: number };
  } | null>(null);
  const entered = useRef(false);
  const [Globe, setGlobe] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [joining, setJoining] = useState(false);
  const [size, setSize] = useState({ w: 360, h: 240 });
  const [hover, setHover] = useState<Feat | null>(null);
  const [alt, setAlt] = useState(2.35);

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
    try {
      const c = g.controls();
      c.autoRotate = !reduceMotion;
      c.autoRotateSpeed = reduceMotion ? 0 : 0.4;
    } catch {
      /* still loading */
    }
  }, [reduceMotion, Globe]);

  useEffect(() => {
    let stop = false;
    const timer = window.setTimeout(() => {
      if (!stop) setLoadErr((e) => e || "timeout");
    }, 20000);
    const load = () => {
      void import("react-globe.gl")
        .then((m) => {
          const g = (m as { default?: unknown }).default ?? m;
          const Cmp = (g as { default?: unknown }).default ?? g;
          if (!stop) {
            window.clearTimeout(timer);
            setGlobe(() => Cmp as ComponentType<Record<string, unknown>>);
          }
        })
        .catch((err: Error) => {
          if (!stop) setLoadErr(err.message || "globe");
        });
    };
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(load, { timeout: 400 })
        : window.setTimeout(load, 0);
    return () => {
      stop = true;
      window.clearTimeout(timer);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
    };
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let t = 0;
    const apply = () => {
      const w = el.clientWidth || el.getBoundingClientRect().width;
      const h = el.clientHeight || el.getBoundingClientRect().height;
      const next = { w: Math.max(Math.floor(w) || 320, 220), h: Math.max(Math.floor(h) || 220, 200) };
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
    if (far) return coinPins.map((p) => ({ ...p, face: "btc" as const, px: pxFor(p.id) }));
    return [
      ...coinPins.map((p) => ({ ...p, face: "logo" as const, px: pxFor(p.id) })),
      ...ownShops.map((p) => ({ ...p, face: "logo" as const, kind: "shop" as const, px: pxFor(p.id) })),
    ];
  }, [coinPins, ownShops, far, alt]);

  const enterRef = useRef(enter);
  enterRef.current = enter;
  const htmlElement = useCallback(
    (d: { lat: number; lon: number; lat0?: number; lon0?: number; id?: string; name?: string; logo?: string; kind?: "shop" | "community"; face?: "btc" | "logo"; px?: number }) => {
      const el = document.createElement("button");
      const sizePx = d.px ?? globeCoinSize(2.35, d.id === FOUNDING_UY.id);
      const ring = sizePx < 14 ? 1 : 1.5;
      el.type = "button";
      el.title = d.name || "";
      el.style.cssText = `width:${sizePx}px;height:${sizePx}px;padding:0;border:0;border-radius:50%;background:#fff;box-shadow:0 0 0 ${ring}px #f7931a;overflow:hidden;cursor:pointer;pointer-events:auto`;
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
          el.innerHTML = BITCOIN_MARK_SVG;
        };
        el.appendChild(img);
      } else {
        el.innerHTML = BITCOIN_MARK_SVG;
      }
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        enterRef.current(d.lat0 ?? d.lat, d.lon0 ?? d.lon, 13, undefined, d);
      });
      return el;
    },
    [],
  );

  return (
    <div className="space-y-3">
      <header className="rounded-lg bg-white px-3 py-2 text-center shadow-[var(--shadow-border)] sm:px-4 sm:py-3">
        <p className="font-display text-xl text-neutral-900 sm:text-3xl">{t("globeKicker")}</p>
        <p className="mt-1 text-xs text-neutral-600 sm:text-base">{t("globeTitle")}</p>
        {world ? (
          <p className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:mt-3 sm:grid-cols-4 sm:justify-items-center sm:gap-x-5 sm:gap-y-2">
            <span>
              <span className="text-lg font-bold text-primary sm:text-3xl">{world.cities.toLocaleString()}</span>
              <span className="ml-1 text-xs font-medium text-neutral-600 sm:ml-1.5 sm:text-sm">{t("globeCities")}</span>
            </span>
            <span>
              <span className="text-lg font-bold text-primary sm:text-3xl">{world.shops.toLocaleString()}</span>
              <span className="ml-1 text-xs font-medium text-neutral-600 sm:ml-1.5 sm:text-sm">{t("globeShops")}</span>
            </span>
            <span>
              <span className="text-lg font-bold text-primary sm:text-3xl">{world.comms.toLocaleString()}</span>
              <span className="ml-1 text-xs font-medium text-neutral-600 sm:ml-1.5 sm:text-sm">{t("globeComms")}</span>
            </span>
            <span>
              <span className="text-lg font-bold text-primary sm:text-3xl">{world.events.toLocaleString()}</span>
              <span className="ml-1 text-xs font-medium text-neutral-600 sm:ml-1.5 sm:text-sm">{t("globeEvents")}</span>
            </span>
          </p>
        ) : null}
      </header>

      <div className="isolate overflow-hidden rounded-lg bg-white shadow-[var(--shadow-border)]">
      <div
        ref={wrap}
        tabIndex={0}
        title={t("zoomNeedFocus")}
        onPointerDown={() => wrap.current?.focus({ preventScroll: true })}
        onFocus={() => {
          const g = globeRef.current;
          if (g) g.controls().enableZoom = true;
        }}
        onBlur={() => {
          const g = globeRef.current;
          if (g) g.controls().enableZoom = false;
        }}
        className="bit-stage relative z-0 overflow-hidden bg-white outline-none focus-visible:shadow-[var(--shadow-border-hover)]"
      >
      {Globe && !geo.isPending && !geo.isError ? (
        <Globe
          ref={globeRef}
          width={Math.max(size.w, 220)}
          height={Math.max(size.h, 200)}
          backgroundColor="#ffffff"
          globeImageUrl={WHITE}
          showAtmosphere={false}
          animateIn={false}
          rendererConfig={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
          pointOfView={{ lat: -15, lng: -58, altitude: 2.35 }}
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
          htmlAltitude={0.008}
          htmlTransitionDuration={0}
          htmlElement={htmlElement}
          pointsData={[]}
          onZoom={(pov: { altitude?: number }) => {
            const a = Number(pov?.altitude);
            if (!Number.isFinite(a)) return;
            setAlt((prev) => (Math.abs(prev - a) < 0.12 ? prev : a));
          }}
          onPolygonHover={(d: Feat | null) => setHover(d)}
          onPolygonClick={(d: Feat) => {
            const cap = capitalOf(d.iso);
            if (cap) {
              enter(cap.lat, cap.lon, 11, d.iso);
              return;
            }
            const row = stats.data?.countries.find((c) => c.iso === d.iso);
            const c = row && row.lat ? row : featCenter(d.geometry);
            enter(c.lat, c.lon, 6, d.iso);
          }}
          onGlobeReady={() => {
            const g = globeRef.current;
            if (!g) return;
            const c = g.controls();
            c.autoRotate = !reduceMotion;
            c.autoRotateSpeed = reduceMotion ? 0 : 0.4;
            c.enableZoom = document.activeElement === wrap.current;
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
        <div className="pointer-events-none absolute top-12 right-2 left-2 z-20 rounded-md bg-white/95 px-3 py-2 shadow-[var(--shadow-border)] sm:top-auto sm:right-auto sm:bottom-4 sm:left-1/2 sm:w-[min(92%,320px)] sm:-translate-x-1/2">
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border px-3 py-2">
        <button
          type="button"
          className="h-9 w-fit max-w-full justify-self-start rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-60"
          onClick={() => void joinHere()}
          disabled={joining}
        >
          {joining ? t("geoWait") : t("globeJoin")}
        </button>
        <p className="hidden text-center text-xs text-neutral-500 sm:block">{t("globeHint")}</p>
        <button
          type="button"
          className="h-9 w-fit max-w-full justify-self-end rounded-md bg-primary px-3 text-sm font-medium text-white"
          onClick={onSkip}
        >
          {t("globeSkip")}
        </button>
      </div>
      </div>
    </div>
  );
}

export function WorldGlobe({ onEnter, onSkip }: { onEnter: (focus: GlobeFocus) => void; onSkip: () => void }) {
  return (
    <ClientOnly fallback={<div className="bit-stage rounded-lg bg-white shadow-[var(--shadow-border)]" />}>
      <GlobeCanvas onEnter={onEnter} onSkip={onSkip} />
    </ClientOnly>
  );
}
