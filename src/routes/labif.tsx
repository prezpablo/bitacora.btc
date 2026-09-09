import { createFileRoute } from "@tanstack/react-router";
import { LabifDossier } from "@/components/labif-dossier";
import { retainLangSearch } from "@/lib/locale";

export const Route = createFileRoute("/labif")({
  validateSearch: retainLangSearch,
  component: LabifDossier,
});
