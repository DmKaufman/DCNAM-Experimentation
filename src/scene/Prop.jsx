import { useRef, useState } from "react";
import { Edges, Html } from "@react-three/drei";

// Generic interactive box: a rack row, a PDU, a CRAC unit, or a containment wall.
export default function Prop({
  id,
  label,
  position,
  size,
  color = "#9aa0a6",
  opacity = 1,
  selectedId,
  onSelect,
  alwaysShowLabel = true,
  // Extra margin (x, y, z) added to the invisible click target so tightly
  // packed racks don't need pixel-perfect aim. Purely for hit-testing —
  // the visible box stays its real size.
  hitPadding = [0.15, 0.4, 0.3],
}) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const selected = selectedId === id;
  const showLabel = alwaysShowLabel || hovered || selected;

  const edgeColor = selected ? "#2fd97a" : hovered ? "#4da3ff" : "#5b6068";
  const displayColor = selected ? shade(color, 0.15) : hovered ? shade(color, 0.08) : color;
  const hitSize = [size[0] + hitPadding[0], size[1] + hitPadding[1], size[2] + hitPadding[2]];

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={displayColor}
          roughness={0.6}
          metalness={0.1}
          transparent={opacity < 1}
          opacity={opacity}
        />
        <Edges scale={1.001} color={edgeColor} lineWidth={selected ? 2 : 1} />
      </mesh>

      {/* Invisible, padded hit target — handles all pointer events */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(selected ? null : id);
        }}
      >
        <boxGeometry args={hitSize} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {showLabel && (
        <Html position={[0, size[1] / 2 + 0.35, 0]} center distanceFactor={18} zIndexRange={[10, 0]}>
          <div className={`rack-tag${selected ? " rack-tag--selected" : ""}`}>{label}</div>
        </Html>
      )}
    </group>
  );
}

function shade(hex, amount) {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  let r = (num >> 16) + Math.round(255 * amount);
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * amount);
  let b = (num & 0x0000ff) + Math.round(255 * amount);
  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);
  return `rgb(${r}, ${g}, ${b})`;
}
