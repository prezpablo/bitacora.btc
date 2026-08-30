import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mapa")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "mapa" });
  },
});
