import type { Camera } from "three";
import { daysSinceJ2000 } from "./kepler";
import type { BodyId } from "./bodies";

export type Vec3 = { x: number; y: number; z: number };

export const runtime = {
  days: daysSinceJ2000(),
  camera: null as Camera | null,
  size: { w: 1, h: 1 },
  positions: {} as Partial<Record<BodyId, Vec3>>,
};

export function resetToNow(): void {
  runtime.days = daysSinceJ2000();
}

export function setEpochDays(days: number): void {
  runtime.days = days;
}
