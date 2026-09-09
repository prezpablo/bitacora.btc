import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@/components/dashboard/client-only";
import { MapGate } from "@/components/map/map-gate";
import { SiteShell } from "@/components/site-header";
import { useAppLang } from "@/lib/i18n";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/mapa")({ component: MapaPage });

function MapaPage() {
  const lang = useAppLang();
  const heading = pageSeo("/mapa", lang).title.replace(/\s*[|·]\s*Bitácora\.btc\s*$/i, "");
  return (
    <SiteShell>
      <section id="mapa" className="scroll-mt-[var(--header-offset)] min-h-[min(70dvh,640px)]">
        <h1 className="font-display mb-3 text-xl font-medium tracking-tight text-foreground sm:text-2xl">{heading}</h1>
        <ClientOnly fallback={<div className="h-[min(70dvh,640px)] rounded-lg bg-white shadow-[var(--shadow-border)]" />}>
          <MapGate embedded />
        </ClientOnly>
      </section>
    </SiteShell>
  );
}
