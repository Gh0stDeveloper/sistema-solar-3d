import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Stars } from "@react-three/drei";
import * as THREE from "three";
import { PLANETS } from "@/lib/solar/bodies";
import { runtime } from "@/lib/solar/runtime";
import { stepPositions } from "@/lib/solar/step";
import { useSolar } from "@/lib/solar/store";
import { AsteroidBelt, OrbitPaths, Planet, Sun, Trails } from "./celestial";
import { CameraRig } from "./camera-rig";

function RuntimeSync() {
  const { camera, size } = useThree();
  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const { paused, speed } = useSolar.getState();
    if (!paused) runtime.days += speed * d;
    stepPositions();
    runtime.camera = camera;
    runtime.size.w = size.width;
    runtime.size.h = size.height;
  });
  return null;
}

function Lights() {
  return (
    <>
      <color attach="background" args={["#07070a"]} />
      <ambientLight intensity={0.055} color="#c8d0dc" />
      <hemisphereLight args={["#9aa8c4", "#1a1612", 0.09]} />
    </>
  );
}

export function SolarCanvas() {
  return (
    <Canvas
      className="absolute inset-0 touch-none"
      camera={{ position: [36, 58, 188], fov: 42, near: 0.12, far: 2800 }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#07070a");
        stepPositions();
      }}
    >
      <AdaptiveDpr />
      <Lights />
      <Stars radius={420} depth={70} count={5600} factor={3.1} saturation={0.05} fade speed={0.28} />
      <RuntimeSync />
      <CameraRig />
      <Sun />
      {PLANETS.map((p) => (
        <Planet key={p.id} body={p} />
      ))}
      <OrbitPaths />
      <Trails />
      <AsteroidBelt />
    </Canvas>
  );
}
