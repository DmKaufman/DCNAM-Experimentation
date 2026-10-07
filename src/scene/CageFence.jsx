import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

function useChainLinkTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "rgba(45,48,53,0.95)";
    ctx.lineWidth = 3;
    const step = 16;
    for (let x = -size; x < size * 2; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + size, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, size);
      ctx.lineTo(x + size, 0);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 3);
    return texture;
  }, []);
}

function Panel({ position, size, texture }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#3a3d42"
        map={texture}
        transparent
        opacity={0.85}
        alphaTest={0.1}
        side={THREE.DoubleSide}
        roughness={0.8}
      />
    </mesh>
  );
}

function Post({ position, height }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.12, height, 0.12]} />
      <meshStandardMaterial color="#2c2f33" roughness={0.5} metalness={0.3} />
    </mesh>
  );
}

// A chain-link security cage wrapping the customer's racks, with a badge-access
// gate on the side facing the rest of the hall.
export default function CageFence({ bounds, height = 3.2, doorWidth = 1.8, label = "Cage 01 — Badge Access" }) {
  const texture = useChainLinkTexture();
  const { xMin, xMax, zMin, zMax } = bounds;
  const xSpan = xMax - xMin;
  const zSpan = zMax - zMin;
  const xCenter = (xMin + xMax) / 2;

  const doorLeftX = xCenter - doorWidth / 2;
  const doorRightX = xCenter + doorWidth / 2;

  return (
    <group>
      <Panel position={[xMin, height / 2, (zMin + zMax) / 2]} size={[0.05, height, zSpan]} texture={texture} />
      <Panel position={[xMax, height / 2, (zMin + zMax) / 2]} size={[0.05, height, zSpan]} texture={texture} />
      <Panel position={[xCenter, height / 2, zMin]} size={[xSpan, height, 0.05]} texture={texture} />

      <Panel
        position={[(xMin + doorLeftX) / 2, height / 2, zMax]}
        size={[doorLeftX - xMin, height, 0.05]}
        texture={texture}
      />
      <Panel
        position={[(doorRightX + xMax) / 2, height / 2, zMax]}
        size={[xMax - doorRightX, height, 0.05]}
        texture={texture}
      />

      {[
        [xMin, zMin],
        [xMax, zMin],
        [xMin, zMax],
        [xMax, zMax],
        [doorLeftX, zMax],
        [doorRightX, zMax],
      ].map(([x, z], i) => (
        <Post key={i} position={[x, height / 2, z]} height={height} />
      ))}

      <Html position={[xCenter, height + 0.4, zMax]} center distanceFactor={20} zIndexRange={[10, 0]}>
        <div className="rack-tag">{label}</div>
      </Html>
    </group>
  );
}
