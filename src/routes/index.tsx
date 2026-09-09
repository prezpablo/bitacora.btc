import { createFileRoute } from "@tanstack/react-router";
import { Desk } from "@/components/dashboard/desk";
import { retainLangSearch } from "@/lib/locale";

export const Route = createFileRoute("/")({
  validateSearch: retainLangSearch,
  component: Home,
});

function Home() {
  return <Desk />;
}
