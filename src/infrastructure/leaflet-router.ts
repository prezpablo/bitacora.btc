import type { GuidePt } from "@/domain/guide";
import { geodesicLine, kmBetween } from "@/domain/guide";
import { getGuidePath } from "./server-fns";

type LMod = typeof import("leaflet");
type Wp = { latLng: { lat: number; lng: number } };

export async function loadLeafletRouting(L: LMod) {
  const leaf = ((L as { default?: LMod }).default || L) as LMod;
  const g = window as Window & { L?: LMod };
  g.L = leaf;
  await import("leaflet-routing-machine/dist/leaflet-routing-machine.css");
  await import("leaflet-routing-machine");
  return (g.L as LMod & { Routing: { control: (opts: Record<string, unknown>) => RoutingCtrl } }).Routing;
}

export type RoutingCtrl = {
  addTo: (map: import("leaflet").Map) => RoutingCtrl;
  remove: () => void;
  setWaypoints: (wps: import("leaflet").LatLng[]) => void;
  getWaypoints: () => Wp[];
  on: (ev: string, fn: () => void) => void;
};

export function bitacoraRouter(L: LMod) {
  return {
    route(waypoints: Wp[], callback: (err: Error | null, routes?: unknown[]) => void) {
      const a = waypoints[0]?.latLng;
      const b = waypoints[waypoints.length - 1]?.latLng;
      if (!a || !b) {
        callback(new Error("wp"));
        return;
      }
      const from: GuidePt = { lat: a.lat, lon: a.lng };
      const to: GuidePt = { lat: b.lat, lon: b.lng };
      void getGuidePath({ data: { fromLat: from.lat, fromLon: from.lon, toLat: to.lat, toLon: to.lon } })
        .then((res) => {
          const pts = res?.path && res.path.length >= 2 ? res.path : geodesicLine(from, to);
          const coordinates = pts.map((p) => L.latLng(p.lat, p.lon));
          const km = kmBetween(from, to);
          callback(null, [
            {
              name: "",
              coordinates,
              instructions: [],
              summary: { totalDistance: km * 1000, totalTime: (km / 4.5) * 3600 },
              inputWaypoints: waypoints,
              waypoints,
            },
          ]);
        })
        .catch((err: Error) => callback(err));
    },
  };
}

export function guideMarker(L: LMod, i: number, latlng: import("leaflet").LatLngExpression) {
  const label = i === 0 ? "⊙" : "₿";
  return L.marker(latlng, {
    draggable: true,
    zIndexOffset: 900,
    icon: L.divIcon({
      className: "bitacora-guide-pin",
      html: `<span style="display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:999px;background:#f7931a;color:#fff;font-weight:700;border:2px solid #fff">${label}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    }),
  });
}
