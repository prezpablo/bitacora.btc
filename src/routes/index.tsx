import { createFileRoute } from "@tanstack/react-router";
import { Desk } from "@/components/dashboard/desk";
import { getEventHtml } from "@/infrastructure/server-fns";
import { retainLangSearch } from "@/lib/locale";

export const Route = createFileRoute("/")({
  validateSearch: retainLangSearch,
  loader: () => getEventHtml(),
  component: Home,
});

function Home() {
  return <Desk eventHtml={Route.useLoaderData()} />;
}
