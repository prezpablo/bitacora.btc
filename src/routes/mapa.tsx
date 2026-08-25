import { createFileRoute } from "@tanstack/react-router";
import { SpendMap } from "@/components/map/spend-map";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/mapa")({ component: MapPage });

function MapPage() {
  return (
    <main>
      <SpendMap />
    </main>
  );
}
