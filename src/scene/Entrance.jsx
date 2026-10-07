import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

function DoorFrame({ width, height }) {
  return (
    <group>
      <mesh position={[-width / 2, height / 2, 0]}>
        <boxGeometry args={[0.08, height, 0.08]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.5} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]}>
        <boxGeometry args={[0.08, height, 0.08]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.5} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width + 0.16, 0.08, 0.08]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.5} />
      </mesh>
    </group>
  );
}

// A quarter-circle door-swing arc drawn flat on the floor — standard
// architectural shorthand that reads as "this is a door" at a glance.
function SwingArc({ radius }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.absarc(0, 0, radius, 0, Math.PI / 2, false);
    s.lineTo(0, 0);
    return s;
  }, [radius]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color="#8a8f98" transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  );
}

// A doorway marker: frame + floor swing-arc + label. Purely decorative
// (non-interactive) — it's here to orient the viewer, not to be clicked.
export default function Entrance({ position, label, type = "main", width = 1.8, swingRadius = 1.8 }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <DoorFrame width={width} height={2.2} />
      <SwingArc radius={swingRadius} />
      <Html position={[0, 2.6, 0]} center distanceFactor={20} zIndexRange={[10, 0]}>
        <div className={`rack-tag entrance-tag entrance-tag--${type}`}>{label}</div>
      </Html>
    </group>
  );
}
