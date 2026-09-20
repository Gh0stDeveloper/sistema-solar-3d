import { Overlay } from "@/components/hud/overlay";
import { PlanetLabels } from "@/components/hud/labels";
import { SolarCanvas } from "./scene";

export function SolarApp() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <SolarCanvas />
      <PlanetLabels />
      <Overlay />
    </main>
  );
}
