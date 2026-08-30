import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import type { GlobeFocus } from "@/domain/globe";
import { capitalOf } from "@/domain/capitals";
import { mapKeys, useGlobeStats } from "@/lib/map-query";
import { localeTag } from "@/lib/display";
import { useLocale } from "@/lib/locale";
import { useT } from "@/lib/i18n";
import { BITCOIN_MARK_SVG } from "@/components/dashboard/brand-mark";
import { ClientOnly } from "@/components/dashboard/client-only";

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
  const lang = useLocale((s) => s.lang);
  const wrap = useRef<HTMLDivElement>(null);
  const globeRef = useRef<{ controls: () => { autoRotate: boolean; autoRotateSpeed: number }; pointOfView: () => { lat: number; lng: number; altitude: number } } | null>(null);
  const entered = useRef(false);
  const [Globe, setGlobe] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hover, setHover] = useState<Feat | null>(null);

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
    let stop = false;
    const timer = window.setTimeout(() => {
      if (!stop) setLoadErr((e) => e || "timeout");
    }, 12000);
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
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const apply = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames([localeTag(lang)], { type: "region" });
    } catch {
      return null;
    }
  }, [lang]);

  function enter(lat: number, lon: number, zoom: number, iso?: string) {
    if (entered.current) return;
    entered.current = true;
    onEnter({ lat, lon, zoom, iso });
  }

  const world = stats.data?.world;
  const pins = useMemo(() => {
    const over = stats.data?.overlay || [];
    const rest = stats.data?.points || [];
    const seen = new Set(over.map((p) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`));
    const cap = size.w < 640 ? 90 : 360;
    return [...over, ...rest.filter((p) => !seen.has(`${p.lat.toFixed(3)},${p.lon.toFixed(3)}`))].slice(0, cap);
  }, [stats.data?.overlay, stats.data?.points, size.w]);

  return (
    <div className="space-y-3">
      <header className="rounded-lg bg-white px-4 py-3 text-center shadow-[var(--shadow-border)]">
        <p className="font-display text-2xl text-neutral-900 sm:text-3xl">{t("globeKicker")}</p>
        <p className="mt-1 text-sm text-neutral-600 sm:text-base">{t("globeTitle")}</p>
        {world ? (
          <p className="mt-3 flex flex-wrap items-baseline justify-center gap-x-5 gap-y-1">
            <span>
              <span className="text-2xl font-bold text-primary sm:text-3xl">{world.cities.toLocaleString()}</span>
              <span className="ml-1.5 text-sm font-medium text-neutral-600">{t("globeCities")}</span>
            </span>
            <span>
              <span className="text-2xl font-bold text-primary sm:text-3xl">{world.shops.toLocaleString()}</span>
              <span className="ml-1.5 text-sm font-medium text-neutral-600">{t("globeShops")}</span>
            </span>
            <span>
              <span className="text-2xl font-bold text-primary sm:text-3xl">{world.comms.toLocaleString()}</span>
              <span className="ml-1.5 text-sm font-medium text-neutral-600">{t("globeComms")}</span>
            </span>
            <span>
              <span className="text-2xl font-bold text-primary sm:text-3xl">{world.events.toLocaleString()}</span>
              <span className="ml-1.5 text-sm font-medium text-neutral-600">{t("globeEvents")}</span>
            </span>
          </p>
        ) : null}
      </header>

      <div
        ref={wrap}
        className="relative z-0 h-[min(58dvh,520px)] w-full min-h-[320px] overflow-hidden rounded-lg bg-white shadow-[var(--shadow-border)] sm:h-[min(78dvh,740px)]"
      >
      {Globe ? (
        <Globe
          ref={globeRef}
          width={Math.max(size.w, 280)}
          height={Math.max(size.h, 280)}
          backgroundColor="#ffffff"
          globeImageUrl={WHITE}
          showAtmosphere={false}
          animateIn={false}
          pointOfView={{ lat: -15, lng: -58, altitude: 2.35 }}
          polygonsData={features}
          polygonGeoJsonGeometry="geometry"
          polygonCapColor={(d: Feat) => {
            const on = d.shops + d.comms + d.events + d.cities > 0;
            if (hover?.iso === d.iso) return "rgba(247,147,26,0.32)";
            return on ? "rgba(247,147,26,0.14)" : "#ffffff";
          }}
          polygonSideColor={() => "#111111"}
          polygonStrokeColor={() => "#111111"}
          polygonAltitude={(d: Feat) => {
            if (hover?.iso === d.iso) return 0.012;
            return d.shops + d.comms + d.events + d.cities > 0 ? 0.005 : 0.003;
          }}
          polygonsTransitionDuration={180}
          htmlElementsData={pins}
          htmlLat="lat"
          htmlLng="lon"
          htmlAltitude={0.018}
          htmlElement={(d: { lat: number; lon: number; n: number }) => {
            const el = document.createElement("button");
            const sizePx = size.w < 640 ? 12 + Math.min(8, Math.sqrt(d.n) * 0.9) : 14 + Math.min(16, Math.sqrt(d.n) * 1.4);
            el.type = "button";
            el.style.cssText = `width:${sizePx}px;height:${sizePx}px;padding:0;border:0;background:transparent;cursor:pointer;pointer-events:auto;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))`;
            el.innerHTML = BITCOIN_MARK_SVG;
            el.addEventListener("click", (ev) => {
              ev.stopPropagation();
              enter(d.lat, d.lon, 8);
            });
            return el;
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
            c.autoRotate = true;
            c.autoRotateSpeed = 0.4;
          }}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-neutral-500">{loadErr ? t("globeFail") : t("loading")}</p>
          {loadErr ? (
            <button type="button" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-white" onClick={onSkip}>
              {t("globeSkip")}
            </button>
          ) : null}
        </div>
      )}

      {hover ? (
        <div className="pointer-events-none absolute top-2 right-14 left-2 z-20 rounded-md bg-white/95 px-3 py-2 shadow-[var(--shadow-border)] sm:top-auto sm:right-auto sm:bottom-16 sm:left-1/2 sm:w-[min(92%,320px)] sm:-translate-x-1/2">
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
      ) : (
        <p className="pointer-events-none absolute bottom-12 left-1/2 z-10 hidden -translate-x-1/2 text-xs text-neutral-500 sm:block">
          {t("globeHint")}
        </p>
      )}

      <button
        type="button"
        className="absolute top-2 right-2 z-20 h-9 rounded-md bg-primary px-3 text-sm font-medium text-white sm:top-auto sm:right-3 sm:bottom-3"
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
    <ClientOnly fallback={<div className="h-[min(88dvh,820px)] rounded-lg bg-white" />}>
      <GlobeCanvas onEnter={onEnter} onSkip={onSkip} />
    </ClientOnly>
  );
}
