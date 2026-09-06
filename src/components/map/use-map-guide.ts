import { useRef, useState } from "react";
import { locateOnConsent } from "@/application/locate-user";
import type { GeoFix } from "@/domain/geo-frame";
import { boxAround } from "@/domain/geo-frame";
import { isPreciseFix } from "@/domain/geo-fix";
import { formatGuideStep, geodesicLine, kmBetween, type GuideStep } from "@/domain/guide";
import { getApproxFix, getCityFrame, getGuidePath } from "@/infrastructure/server-fns";
import { locateBest, requestIpFix, startGpsFromGesture } from "@/infrastructure/geo";
import { guideMarker } from "@/infrastructure/leaflet-router";
import type { AppLang } from "@/lib/locale";
import { prefersReducedMotion } from "@/lib/motion";
import { applyFix } from "./leaflet-fix";

type LeafletMap = import("leaflet").Map;
type LeafletMod = typeof import("leaflet");

export function useMapGuide(lang: AppLang, t: (k: string) => string) {
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletMod | null>(null);
  const userMark = useRef<import("leaflet").LayerGroup | null>(null);
  const routeLine = useRef<import("leaflet").Polyline | null>(null);
  const routingRef = useRef<{ remove: () => void } | null>(null);
  const originMark = useRef<import("leaflet").Marker | null>(null);
  const destMark = useRef<import("leaflet").Marker | null>(null);
  const stepLayer = useRef<import("leaflet").LayerGroup | null>(null);
  const pickOriginRef = useRef(false);
  const guideToRef = useRef<{ lat: number; lon: number } | null>(null);
  const onPickOrigin = useRef<(lat: number, lon: number) => void>(() => {});

  const [geo, setGeo] = useState<"idle" | "wait" | "ok" | "denied">("idle");
  const [userFix, setUserFix] = useState<{ lat: number; lon: number } | null>(null);
  const [guideWait, setGuideWait] = useState(false);
  const [guideErr, setGuideErr] = useState("");
  const [guideSteps, setGuideSteps] = useState<GuideStep[]>([]);
  const [pickOrigin, setPickOrigin] = useState(false);

  function wipeLine() {
    const map = mapRef.current;
    if (routeLine.current && map) {
      map.removeLayer(routeLine.current);
      routeLine.current = null;
    }
    if (stepLayer.current) stepLayer.current.clearLayers();
    if (routingRef.current) {
      try {
        routingRef.current.remove();
      } catch {
        /* already off */
      }
      routingRef.current = null;
    }
  }

  function clearRoute() {
    const map = mapRef.current;
    wipeLine();
    if (originMark.current && map) {
      map.removeLayer(originMark.current);
      originMark.current = null;
    }
    if (destMark.current && map) {
      map.removeLayer(destMark.current);
      destMark.current = null;
    }
    setGuideSteps([]);
    setGuideErr("");
    pickOriginRef.current = false;
    setPickOrigin(false);
    guideToRef.current = null;
  }

  function placeGuideEnds(from: { lat: number; lon: number }, to: { lat: number; lon: number }) {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (originMark.current) originMark.current.setLatLng([from.lat, from.lon]);
    else {
      const m = guideMarker(L, 0, [from.lat, from.lon]);
      m.on("dragend", () => {
        const p = m.getLatLng();
        const dest = guideToRef.current;
        if (dest) void drawFrom({ lat: p.lat, lon: p.lng, accuracy: 25, source: "tap" }, dest);
      });
      m.addTo(map);
      originMark.current = m;
    }
    if (destMark.current) destMark.current.setLatLng([to.lat, to.lon]);
    else {
      const m = guideMarker(L, 1, [to.lat, to.lon]);
      m.addTo(map);
      destMark.current = m;
    }
  }

  function paintLine(path: { lat: number; lon: number }[], street: boolean) {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || path.length < 2) return;
    wipeLine();
    const line = L.polyline(
      path.map((p) => [p.lat, p.lon] as [number, number]),
      { color: "#f7931a", weight: 5, opacity: 0.92, dashArray: street ? undefined : "8 8" },
    );
    line.addTo(map);
    routeLine.current = line;
    map.fitBounds(line.getBounds(), { padding: [36, 36], maxZoom: 16, animate: !prefersReducedMotion() });
  }

  async function drawFrom(from: GeoFix | { lat: number; lon: number }, to: { lat: number; lon: number }) {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    setUserFix(from);
    guideToRef.current = to;
    placeGuideEnds(from, to);
    paintLine(geodesicLine(from, to), false);
    let path: { lat: number; lon: number }[] = [];
    let steps: GuideStep[] = [];
    try {
      const res = await getGuidePath({
        data: { fromLat: from.lat, fromLon: from.lon, toLat: to.lat, toLon: to.lon },
      });
      if (
        !guideToRef.current ||
        Math.abs(guideToRef.current.lat - to.lat) > 1e-6 ||
        Math.abs(guideToRef.current.lon - to.lon) > 1e-6
      )
        return;
      path = res?.path || [];
      steps = res?.steps || [];
    } catch {
      path = [];
    }
    const street = path.length >= 2;
    if (!street) path = geodesicLine(from, to);
    placeGuideEnds(from, to);
    paintLine(path, street);
    if (!stepLayer.current) stepLayer.current = L.layerGroup().addTo(map);
    const group = stepLayer.current;
    group.clearLayers();
    for (const s of steps) {
      L.circleMarker([s.lat, s.lon], {
        radius: 6,
        color: "#fff",
        weight: 2,
        fillColor: "#f7931a",
        fillOpacity: 1,
      })
        .bindTooltip(formatGuideStep(s, lang), { direction: "top", opacity: 0.95 })
        .addTo(group);
    }
    setGuideSteps(steps);
    const gps = "source" in from ? from : null;
    if (!street) setGuideErr(t("irFail"));
    else if (gps && gps.source === "gps" && !isPreciseFix(gps)) setGuideErr(t("irLoose"));
    else if (gps && gps.source !== "gps" && gps.source !== "tap") setGuideErr(t("irApprox"));
    else if (!steps.length) setGuideErr(t("irFail"));
    else setGuideErr("");
  }

  onPickOrigin.current = (lat, lon) => {
    pickOriginRef.current = false;
    setPickOrigin(false);
    const dest = guideToRef.current;
    if (!dest) return;
    setGuideErr("");
    void drawFrom({ lat, lon, accuracy: 25, source: "tap" }, dest);
  };

  async function goToUser(preferGps: boolean) {
    setGeo("wait");
    try {
      if (preferGps) {
        const session = startGpsFromGesture();
        mapRef.current?.locate({ setView: false, enableHighAccuracy: true, timeout: 12_000, maximumAge: 8_000 });
        const { fix } = await locateOnConsent(session, { ip: async () => requestIpFix().catch(() => null) });
        if (!fix) {
          setGeo("denied");
          return;
        }
        const city = boxAround(fix.lat, fix.lon, "acá", fix.source === "gps" ? 0.04 : 0.14);
        const L = leafletRef.current;
        const map = mapRef.current;
        if (!L || !map) return;
        applyFix(L, map, userMark.current, fix.lat, fix.lon, fix.accuracy, city);
        map.invalidateSize();
        setUserFix({ lat: fix.lat, lon: fix.lon });
        setGeo(fix.source === "gps" ? "ok" : "idle");
        return;
      }
      const { fix, city } = await locateBest(false, (lat, lon, zoom) =>
        getCityFrame({ data: { lat, lon, zoom } }).catch(() => boxAround(lat, lon)),
      );
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;
      applyFix(L, map, userMark.current, fix.lat, fix.lon, fix.accuracy, city);
      map.invalidateSize();
      setUserFix({ lat: fix.lat, lon: fix.lon });
      setGeo("idle");
    } catch {
      setGeo("denied");
    }
  }

  async function runGuide(to: { lat: number; lon: number }, session: ReturnType<typeof startGpsFromGesture>) {
    setGuideWait(true);
    setGuideErr("");
    guideToRef.current = to;
    try {
      const { fix, refine } = await locateOnConsent(session, {
        ip: async () => {
          try {
            return await requestIpFix();
          } catch {
            /* beacon */
          }
          try {
            const a = await getApproxFix();
            return a ? { lat: a.lat, lon: a.lon, accuracy: a.accuracy, source: "ip" as const } : null;
          } catch {
            return null;
          }
        },
      });
      if (fix && (fix.source === "gps" || fix.source === "tap" || kmBetween(fix, to) >= 0.08)) {
        await drawFrom(fix, to);
        setGeo(fix.source === "gps" ? "ok" : "idle");
      } else {
        pickOriginRef.current = true;
        setPickOrigin(true);
        setGuideErr(t("irTap"));
        setGeo("denied");
      }
      void refine.then((better) => {
        if (!better || better.source !== "gps") return;
        if (fix && better.accuracy >= fix.accuracy - 20) return;
        setGeo("ok");
        pickOriginRef.current = false;
        setPickOrigin(false);
        void drawFrom(better, to);
      });
    } finally {
      setGuideWait(false);
    }
  }

  function startGuide(to: { lat: number; lon: number }) {
    guideToRef.current = to;
    pickOriginRef.current = true;
    setPickOrigin(true);
    setGuideWait(true);
    setGuideErr(t("irTap"));
    const map = mapRef.current;
    const c = map?.getCenter();
    const guess = userFix || (c ? { lat: c.lat, lon: c.lng } : null);
    if (guess && kmBetween(guess, to) >= 0.08) void drawFrom(guess, to);
    const session = startGpsFromGesture();
    if (map) {
      map.stopLocate();
      map.once("locationfound", (e: { latlng: { lat: number; lng: number }; accuracy?: number }) => {
        session.note({
          lat: e.latlng.lat,
          lon: e.latlng.lng,
          accuracy: e.accuracy || 80,
          source: "gps",
        });
      });
      map.locate({ setView: false, enableHighAccuracy: true, timeout: 12_000, maximumAge: 8_000 });
    }
    void runGuide(to, session);
  }

  return {
    mapRef,
    leafletRef,
    userMark,
    pickOriginRef,
    onPickOrigin,
    geo,
    setGeo,
    userFix,
    guideWait,
    guideErr,
    guideSteps,
    pickOrigin,
    clearRoute,
    goToUser,
    startGuide,
    applyHere: (lat: number, lon: number, accuracy: number, city: import("@/domain/geo-frame").CityFrame) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;
      applyFix(L, map, userMark.current, lat, lon, accuracy, city);
    },
  };
}
