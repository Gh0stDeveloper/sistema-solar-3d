import { createFileRoute } from "@tanstack/react-router";
import { SolarApp } from "@/components/solar/solar-app";

export const Route = createFileRoute("/")({
  ssr: false,
  component: SolarApp,
});
