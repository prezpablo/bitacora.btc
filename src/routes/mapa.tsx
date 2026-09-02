import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@/components/dashboard/client-only";
import { MapGate } from "@/components/map/map-gate";
import { SiteShell } from "@/components/site-header";

export const Route = createFileRoute("/mapa")({ component: MapaPage });

function MapaPage() {
  return (
    <SiteShell>
      <section id="mapa" className="scroll-mt-[var(--header-offset)] min-h-[min(70dvh,640px)]">
        <ClientOnly fallback={<div className="h-[min(70dvh,640px)] rounded-lg bg-white shadow-[var(--shadow-border)]" />}>
          <MapGate embedded />
        </ClientOnly>
      </section>
    </SiteShell>
  );
}
