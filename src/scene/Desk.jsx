import { Html } from "@react-three/drei";

const LEG_OFFSETS = [
  [-0.6, -0.28],
  [0.6, -0.28],
  [-0.6, 0.28],
  [0.6, 0.28],
];

// A simple low-poly workstation: desktop, legs, monitor, and a chair —
// enough to read as "someone sits here" without needing full interactivity.
export default function Desk({ position, name }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.05, 0.65]} />
        <meshStandardMaterial color="#c9b79c" roughness={0.7} />
      </mesh>

      {LEG_OFFSETS.map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.36, lz]}>
          <boxGeometry args={[0.05, 0.72, 0.05]} />
          <meshStandardMaterial color="#6b6f76" />
        </mesh>
      ))}

      <mesh position={[0, 1.0, -0.22]}>
        <boxGeometry args={[0.5, 0.32, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.42, 0.55]}>
        <cylinderGeometry args={[0.22, 0.24, 0.06, 16]} />
        <meshStandardMaterial color="#3a3d42" />
      </mesh>
      <mesh position={[0, 0.66, 0.72]}>
        <boxGeometry args={[0.4, 0.42, 0.05]} />
        <meshStandardMaterial color="#3a3d42" />
      </mesh>

      <Html position={[0, 1.35, 0]} center distanceFactor={22} zIndexRange={[10, 0]}>
        <div className="rack-tag">{name}</div>
      </Html>
    </group>
  );
}
