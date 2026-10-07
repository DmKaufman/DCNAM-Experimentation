import { useMemo } from "react";
import { Grid } from "@react-three/drei";
import Prop from "./Prop";
import CageFence from "./CageFence";
import Desk from "./Desk";
import Entrance from "./Entrance";
import CameraRig from "./CameraRig";
import { tempToColor } from "./heatmap";

export default function Scene({ layout, selectedId, onSelect, heatmapOn, faultFilterOn, darkMode }) {
  const {
    racks,
    pduRacks,
    containmentWalls,
    cracUnits,
    cageBounds,
    CAGE_HEIGHT,
    desks,
    officeFloor,
    entrances,
    hallWalls,
    environment,
    bounds,
  } = layout;

  const bgColor = darkMode ? "#12141a" : "#f4f4f2";
  const floorColor = darkMode ? "#1d2026" : "#e9e9e7";
  const gridCellColor = darkMode ? "#2a2d34" : "#c9c9c7";
  const gridSectionColor = darkMode ? "#3c4049" : "#a9a9a9";
  const officeFloorColor = darkMode ? "#2b2621" : "#e4dccb";
  const hallWallColor = darkMode ? "#565a63" : "#d8d5cd";

  // Frame the camera and floor from the site's actual footprint so smaller
  // or larger buildings aren't over/under-zoomed. Ratios below were tuned
  // against the original hand-picked camera and then generalized.
  const { cameraPosition, cameraTarget, maxDistance, floorPosition, floorSize } = useMemo(() => {
    const centerX = (bounds.xMin + bounds.xMax) / 2;
    const centerZ = (bounds.zMin + bounds.zMax) / 2;
    const spanX = bounds.xMax - bounds.xMin;
    const spanZ = bounds.zMax - bounds.zMin;
    const diagonal = Math.sqrt(spanX * spanX + spanZ * spanZ);

    return {
      cameraTarget: [centerX, 1, centerZ],
      cameraPosition: [centerX + diagonal * 1.09, 1 + diagonal * 0.55, centerZ + diagonal * 0.868],
      maxDistance: diagonal * 2.5,
      floorPosition: [centerX, centerZ],
      floorSize: [Math.max(spanX + 16, 30), Math.max(spanZ + 16, 24)],
    };
  }, [bounds]);

  const allProps = useMemo(
    () => [...racks, ...pduRacks, ...containmentWalls, ...cracUnits],
    [racks, pduRacks, containmentWalls, cracUnits]
  );

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <CameraRig
        allProps={allProps}
        selectedId={selectedId}
        defaultPosition={cameraPosition}
        defaultTarget={cameraTarget}
        maxDistance={maxDistance}
      />

      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#ffffff", "#6b6b6b", 0.4]} />
      <directionalLight
        position={[12, 18, 8]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[floorPosition[0], 0, floorPosition[1]]}
        receiveShadow
      >
        <planeGeometry args={floorSize} />
        <meshStandardMaterial color={floorColor} roughness={0.95} />
      </mesh>
      <Grid
        position={[floorPosition[0], 0.01, floorPosition[1]]}
        args={floorSize}
        cellSize={1}
        cellThickness={0.5}
        cellColor={gridCellColor}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={gridSectionColor}
        fadeDistance={35}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {racks.map((rack) => (
        <Prop
          key={rack.id}
          {...rack}
          color={heatmapOn ? tempToColor(rack.tempF - environment.tempF) : "#9aa0a6"}
          opacity={faultFilterOn && !rack.hasFault ? 0.12 : 1}
          selectedId={selectedId}
          onSelect={onSelect}
          alwaysShowLabel={faultFilterOn && rack.hasFault}
        />
      ))}

      {pduRacks.map((pdu) => (
        <Prop
          key={pdu.id}
          {...pdu}
          color="#e0862c"
          opacity={faultFilterOn ? 0.12 : 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}

      {containmentWalls.map((wall) => (
        <Prop
          key={wall.id}
          {...wall}
          color="#5b8fd6"
          opacity={faultFilterOn ? 0.08 : 0.4}
          selectedId={selectedId}
          onSelect={onSelect}
          alwaysShowLabel={false}
        />
      ))}

      {cracUnits.map((c) => (
        <Prop
          key={c.id}
          {...c}
          color="#8a8f96"
          opacity={faultFilterOn ? 0.12 : 1}
          selectedId={selectedId}
          onSelect={onSelect}
          alwaysShowLabel={false}
        />
      ))}

      <CageFence bounds={cageBounds} height={CAGE_HEIGHT} />

      {/* Office / NOC area floor accent, distinct from the white-space tile */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[officeFloor.center[0], 0.006, officeFloor.center[1]]}
        receiveShadow
      >
        <planeGeometry args={officeFloor.size} />
        <meshStandardMaterial color={officeFloorColor} roughness={0.9} />
      </mesh>

      {/* Low glass partition between the office area and the white space */}
      <mesh position={[officeFloor.center[0], 0.55, cageBounds.zMax + 1]}>
        <boxGeometry args={[officeFloor.size[0], 1.1, 0.06]} />
        <meshStandardMaterial
          color="#bcd2df"
          transparent
          opacity={0.25}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {desks.map((d) => (
        <Desk key={d.id} position={d.position} name={d.name} />
      ))}

      {entrances.map((e) => (
        <Entrance key={e.id} position={e.position} label={e.label} type={e.type} />
      ))}

      {/* Slim perimeter border marking the building's footprint — a curb,
          not a full wall, so it never blocks the view into the hall. */}
      {hallWalls.map((w) => (
        <mesh key={w.id} position={w.position} receiveShadow castShadow>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color={hallWallColor} roughness={0.85} />
        </mesh>
      ))}
    </>
  );
}
