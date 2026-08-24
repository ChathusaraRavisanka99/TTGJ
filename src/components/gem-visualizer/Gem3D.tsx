"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { resolveGemColor } from "./color";
import { buildGemMesh } from "./geometry3d";
import { generateInclusions3D } from "./inclusions";
import { caratToRenderScale } from "./size";

export interface Gem3DProps {
  cutSlug: string;
  hue: number;
  darkness: number;
  claritySlug: string;
  caratWeight: number;
  seedKey?: string;
  className?: string;
  autoRotate?: boolean;
}

function GemMesh({ cutSlug, hue, darkness, claritySlug, caratWeight, seedKey }: Omit<Gem3DProps, "className" | "autoRotate">) {
  const { geometry, smooth } = useMemo(() => buildGemMesh(cutSlug), [cutSlug]);
  const colors = useMemo(() => resolveGemColor(hue, darkness), [hue, darkness]);
  const inclusions = useMemo(() => generateInclusions3D(seedKey ?? cutSlug, claritySlug), [seedKey, cutSlug, claritySlug]);
  const scale = caratToRenderScale(caratWeight);

  return (
    <group rotation={[0.3, 0.5, 0]} scale={scale}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={colors.base}
          transmission={0.6}
          thickness={0.9}
          roughness={0.08}
          ior={1.77}
          attenuationColor={colors.base}
          attenuationDistance={2.5}
          clearcoat={0.7}
          clearcoatRoughness={0.1}
          specularIntensity={1}
          envMapIntensity={1.6}
          flatShading={!smooth}
          side={THREE.DoubleSide}
        />
      </mesh>
      {inclusions.map((speck, i) => (
        <mesh key={i} position={[speck.x, speck.y, speck.z]}>
          <sphereGeometry args={[speck.r, 6, 6]} />
          <meshBasicMaterial color="#2a2a2a" transparent opacity={speck.opacity} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Isolated, props-driven 3D gem renderer used for hero views (product detail,
 * configurator). Kept separate from the lightweight SVG GemVisualizer, which
 * remains the catalog-grid thumbnail so pages don't spin up dozens of
 * simultaneous WebGL contexts.
 */
export function Gem3D({ cutSlug, hue, darkness, claritySlug, caratWeight, seedKey, className, autoRotate = true }: Gem3DProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl", className)}>
      <Canvas camera={{ position: [0, 0, 3.2], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={["#231f1a"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} />
        <directionalLight position={[-3, -2, -4]} intensity={0.5} />
        <Suspense fallback={null}>
          {/* Procedural (network-free) light rig so transmission/refraction has
              something bright to catch, without depending on a remote HDRI. */}
          <Environment resolution={128}>
            <Lightformer form="rect" intensity={4} color="#ffffff" position={[3, 2, 2]} scale={[3, 3, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={2.5} color="#dce8ff" position={[-3, 1, -2]} scale={[3, 4, 1]} target={[0, 0, 0]} />
            <Lightformer form="ring" intensity={3} color="#ffffff" position={[0, -3, 1]} scale={4} target={[0, 0, 0]} />
          </Environment>
          <GemMesh cutSlug={cutSlug} hue={hue} darkness={darkness} claritySlug={claritySlug} caratWeight={caratWeight} seedKey={seedKey} />
          <ContactShadows position={[0, -1.15, 0]} opacity={0.5} scale={5} blur={2.4} far={2} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.8}
          maxDistance={5}
          autoRotate={autoRotate}
          autoRotateSpeed={2.2}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
