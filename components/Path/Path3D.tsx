"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Text, Sphere } from "@react-three/drei";
import * as THREE from "three";

export type PathEntry = {
  id: string;
  created_at: string;
  alignment_score: number;
};

type NodeProps = {
  position: [number, number, number];
  score: number;
  label: string;
  index: number;
};

function PathNode({ position, score, label, index }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const color =
    score >= 5
      ? "#22d3ee"
      : score >= 1
      ? "#4ade80"
      : score === 0
      ? "#94a3b8"
      : score >= -4
      ? "#fb923c"
      : "#f87171";

  useFrame(state => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime + index) * 0.08;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.22}
        color="#f1f5f9"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor="#0f172a"
      >
        {score > 0 ? `+${score}` : String(score)}
      </Text>
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.16}
        color="#94a3b8"
        anchorX="center"
        anchorY="top"
      >
        {label}
      </Text>
    </group>
  );
}

function PathScene({ entries }: { entries: PathEntry[] }) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [entries]
  );

  const positions = useMemo(
    () =>
      sorted.map((e, i) => [
        i * 2.4 - (sorted.length - 1) * 1.2,
        e.alignment_score * 0.35,
        0
      ] as [number, number, number]),
    [sorted]
  );

  const linePoints = useMemo(
    () => positions.map(p => new THREE.Vector3(...p)),
    [positions]
  );

  // Baseline (zero line) for reference.
  const baselineStart = new THREE.Vector3(positions[0]?.[0] ?? -3, 0, 0);
  const baselineEnd = new THREE.Vector3(
    positions[positions.length - 1]?.[0] ?? 3,
    0,
    0
  );

  if (sorted.length === 0) {
    return (
      <Text
        position={[0, 0, 0]}
        fontSize={0.4}
        color="#94a3b8"
        anchorX="center"
      >
        No journal entries yet
      </Text>
    );
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <pointLight position={[-5, 5, -5]} color="#6366f1" intensity={0.8} />

      {/* Zero baseline */}
      <Line
        points={[baselineStart, baselineEnd]}
        color="#334155"
        lineWidth={1}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />

      {/* Path curve */}
      {linePoints.length > 1 && (
        <Line points={linePoints} color="#6366f1" lineWidth={2.5} />
      )}

      {/* Nodes */}
      {sorted.map((entry, i) => (
        <PathNode
          key={entry.id}
          position={positions[i]}
          score={entry.alignment_score}
          label={entry.created_at.slice(5, 10)}
          index={i}
        />
      ))}

      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minDistance={4}
        maxDistance={24}
      />
    </>
  );
}

export default function Path3D({ entries }: { entries: PathEntry[] }) {
  return (
    <Canvas
      camera={{ position: [0, 2, 12], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <PathScene entries={entries} />
    </Canvas>
  );
}
