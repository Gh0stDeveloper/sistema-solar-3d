import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BODY_BY_ID } from "@/lib/solar/bodies";
import { runtime } from "@/lib/solar/runtime";
import { useSolar } from "@/lib/solar/store";

const OVERVIEW = new THREE.Vector3(36, 58, 188);
const _dest = new THREE.Vector3();
const _goalCam = new THREE.Vector3();
const _shift = new THREE.Vector3();
const _dir = new THREE.Vector3();

function bodyFocusDistance(id: string): number {
  if (id === "sun") return 14;
  const body = BODY_BY_ID[id as keyof typeof BODY_BY_ID];
  if (!body) return 12;
  if (body.id === "jupiter" || body.id === "saturn") return body.visualRadius * 6.4;
  return Math.max(body.visualRadius * 7.4, 5.4);
}

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null);
  const selectedId = useSolar((s) => s.selectedId);
  const arriving = useRef(false);
  const prev = useRef<string | null | undefined>(undefined);
  const { camera } = useThree();

  useEffect(() => {
    if (prev.current === selectedId) return;
    prev.current = selectedId;
    arriving.current = true;
    const pos = selectedId ? runtime.positions[selectedId] : { x: 0, y: 0, z: 0 };
    _dest.set(pos?.x ?? 0, pos?.y ?? 0, pos?.z ?? 0);
    const dist = selectedId ? bodyFocusDistance(selectedId) : OVERVIEW.length();
    _dir.copy(camera.position).sub(controls.current?.target ?? _dest);
    if (_dir.lengthSq() < 1e-6) _dir.set(0.55, 0.36, 0.76);
    _dir.normalize();
    _goalCam.copy(_dest).addScaledVector(_dir, dist);
    if (!selectedId) {
      _goalCam.copy(OVERVIEW);
      _dest.set(0, 0, 0);
    }
  }, [selectedId, camera]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const d = Math.min(delta, 0.1);
    const selected = useSolar.getState().selectedId;
    const pos = selected ? runtime.positions[selected] : { x: 0, y: 0, z: 0 };
    _dest.set(pos?.x ?? 0, pos?.y ?? 0, pos?.z ?? 0);

    if (arriving.current) {
      if (selected) {
        _dir.copy(_goalCam).sub(c.target);
        const dist = Math.max(_dir.length(), 0.01);
        _dir.normalize();
        _goalCam.copy(_dest).addScaledVector(_dir, dist);
      } else {
        _dest.set(0, 0, 0);
        _goalCam.copy(OVERVIEW);
      }
      const k = 1 - Math.exp(-3.1 * d);
      c.target.lerp(_dest, k);
      camera.position.lerp(_goalCam, k);
      if (c.target.distanceTo(_dest) < 0.08 && camera.position.distanceTo(_goalCam) < 0.18) {
        arriving.current = false;
      }
    } else if (selected) {
      _shift.copy(_dest).sub(c.target);
      camera.position.add(_shift);
      c.target.copy(_dest);
    }
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.07}
      minDistance={1.35}
      maxDistance={430}
      enablePan
      makeDefault
      zoomSpeed={0.85}
      rotateSpeed={0.72}
    />
  );
}
