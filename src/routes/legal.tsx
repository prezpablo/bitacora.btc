import { createFileRoute } from "@tanstack/react-router";
import { ContactBlock } from "@/components/dashboard/contact";
import { LegalEu } from "@/components/dashboard/legal-eu";
import { SiteShell } from "@/components/site-header";

export const Route = createFileRoute("/legal")({ component: LegalPage });

function LegalPage() {
  return (
    <SiteShell>
      <LegalEu />
      <section id="contacto" className="scroll-mt-[var(--header-offset)]">
        <ContactBlock />
      </section>
    </SiteShell>
  );
}
