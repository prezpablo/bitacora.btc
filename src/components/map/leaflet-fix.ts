import type { CityFrame } from "@/domain/geo-frame";
import { prefersReducedMotion } from "@/lib/motion";

export function applyFix(
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
  const fly = !prefersReducedMotion();
  if (accuracy < 4000) {
    const z = accuracy < 150 ? 16 : accuracy < 600 ? 15 : 14;
    map.setView([lat, lon], z, { animate: fly });
  } else if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13, animate: fly });
  } else {
    map.setView([city.lat, city.lon], 13, { animate: fly });
  }
}
