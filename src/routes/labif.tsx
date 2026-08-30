import { createFileRoute } from "@tanstack/react-router";
import { LabifDossier } from "@/components/labif-dossier";

export const Route = createFileRoute("/labif")({ component: LabifDossier });
