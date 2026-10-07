import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

// Same viewing-angle unit vector as the default overview camera (see
// Scene.jsx's cameraPosition ratios), just applied at a much shorter
// distance — keeps the fly-to feeling continuous with the resting view
// instead of snapping to an arbitrary angle.
const VIEW_DIR = { x: 0.728, y: 0.367, z: 0.579 };
const FLIGHT_DURATION = 0.8;

// Owns the camera + OrbitControls and animates a smooth fly-to whenever
// the selection (or the hall itself) changes, instead of leaving the
// camera static while only the info panel updates. OrbitControls is
// disabled for the flight's duration so it can't fight the tween, then
// handed back to the user once the camera arrives.
export default function CameraRig({ allProps, selectedId, defaultPosition, defaultTarget, maxDistance }) {
  const { camera } = useThree();
  const controlsRef = useRef(null);
  const isFirstRun = useRef(true);
  const flight = useRef({
    active: false,
    t: 0,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
  });

  const selected = useMemo(
    () => (selectedId ? allProps.find((p) => p.id === selectedId) ?? null : null),
    [selectedId, allProps]
  );

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let toPos, toTarget;
    if (selected) {
      const [ox, oy, oz] = selected.position;
      const maxDim = Math.max(...selected.size);
      const dist = maxDim * 3.2 + 3.5;
      toPos = [ox + dist * VIEW_DIR.x, oy + dist * VIEW_DIR.y, oz + dist * VIEW_DIR.z];
      toTarget = [ox, oy, oz];
    } else {
      toPos = defaultPosition;
      toTarget = defaultTarget;
    }

    const f = flight.current;
    f.fromPos.copy(camera.position);
    f.fromTarget.copy(controls.target);
    f.toPos.set(...toPos);
    f.toTarget.set(...toTarget);
    f.t = 0;
    f.active = true;
    controls.enabled = false;
  }, [selected, defaultPosition, defaultTarget, camera]);

  useFrame((_, delta) => {
    const f = flight.current;
    const controls = controlsRef.current;
    if (!f.active || !controls) return;

    f.t = Math.min(1, f.t + delta / FLIGHT_DURATION);
    const eased = 1 - Math.pow(1 - f.t, 3); // ease-out cubic

    camera.position.lerpVectors(f.fromPos, f.toPos, eased);
    controls.target.lerpVectors(f.fromTarget, f.toTarget, eased);
    controls.update();

    if (f.t >= 1) {
      f.active = false;
      controls.enabled = true;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={defaultPosition} fov={45} />
      <OrbitControls
        ref={controlsRef}
        target={defaultTarget}
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={maxDistance}
        maxPolarAngle={Math.PI / 2 - 0.03}
      />
    </>
  );
}
