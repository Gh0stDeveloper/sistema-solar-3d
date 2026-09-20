import { useEffect } from "react";
import * as THREE from "three";
import { BODY_BY_ID, type BodyId } from "@/lib/solar/bodies";
import { runtime } from "@/lib/solar/runtime";
import { useSolar } from "@/lib/solar/store";

const LABEL_IDS: BodyId[] = [
  "sun",
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];

const _v = new THREE.Vector3();

export function PlanetLabels() {
  const show = useSolar((s) => s.showLabels);
  const selected = useSolar((s) => s.selectedId);
  const hovered = useSolar((s) => s.hoveredId);

  useEffect(() => {
    if (!show) return;
    let raf = 0;
    const loop = () => {
      const camera = runtime.camera;
      if (camera) {
        camera.updateMatrixWorld();
        const sun = { x: 0, y: 0 };
        const placed: { x: number; y: number }[] = [];
        for (const id of LABEL_IDS) {
          const el = document.getElementById(`label-${id}`);
          const p = runtime.positions[id];
          if (!el || !p) continue;
          _v.set(p.x, p.y, p.z).project(camera);
          const onScreen = _v.z < 1 && _v.x > -1.15 && _v.x < 1.15 && _v.y > -1.15 && _v.y < 1.15;
          const x = (_v.x * 0.5 + 0.5) * runtime.size.w;
          const y = (-_v.y * 0.5 + 0.5) * runtime.size.h;
          if (id === "sun") {
            sun.x = x;
            sun.y = y;
          }
          let crowded = false;
          if (id !== "sun") {
            const ds = Math.hypot(x - sun.x, y - sun.y);
            if (ds < 44) crowded = true;
            for (const q of placed) {
              if (Math.hypot(x - q.x, y - q.y) < 28) crowded = true;
            }
          }
          const hot = id === selected || id === hovered;
          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -130%)`;
          el.style.opacity = !onScreen || (crowded && !hot) ? "0" : hot ? "1" : "0.82";
          el.dataset.active = hot ? "true" : "false";
          if (!crowded && onScreen) placed.push({ x, y });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [show, selected, hovered]);

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {LABEL_IDS.map((id) => (
        <div key={id} id={`label-${id}`} data-active="false" className="label-tag absolute top-0 left-0">
          {BODY_BY_ID[id].name}
        </div>
      ))}
    </div>
  );
}
