import { useEffect, useMemo, useRef, useState } from "react";
import { tempToColor } from "./heatmap";

const PAD = 3;
const DRAG_THRESHOLD = 4;

function computeView(bounds) {
  return {
    x: bounds.xMin - PAD,
    y: bounds.zMin - PAD,
    w: bounds.xMax - bounds.xMin + PAD * 2,
    h: bounds.zMax - bounds.zMin + PAD * 2,
  };
}

// A true flat schematic — plain colored rectangles and CAD-style symbols in
// a top-down projection, no lighting/perspective/depth. Shares selection
// state with the 3D view via the same selectedId/onSelect contract, so the
// info panel and heatmap toggle keep working identically in both modes.
export default function FloorPlan2D({ layout, selectedId, onSelect, heatmapOn, faultFilterOn, darkMode }) {
  const {
    racks,
    pduRacks,
    containmentWalls,
    cracUnits,
    cageBounds,
    desks,
    officeFloor,
    entrances,
    hallWalls,
    environment,
    bounds,
  } = layout;

  const theme = darkMode
    ? {
        background: "#181a1f",
        grid: "#2a2d33",
        officeFloor: "#2b2621",
        hallWall: "#8b8f98",
        aisleText: "#7fa8e0",
        cageStroke: "#b7bac0",
        rowLabel: "#9599a1",
        deskFill: "#5a4f3d",
        deskStroke: "#8a7a5f",
        deskText: "#c7cad0",
        boxStroke: "#c7cad0",
        doorMain: "#c7cad0",
      }
    : {
        background: "#eeeeec",
        grid: "#d8d8d5",
        officeFloor: "#eee3ce",
        hallWall: "#3a3d42",
        aisleText: "#3b5f91",
        cageStroke: "#2c2f33",
        rowLabel: "#6b6f76",
        deskFill: "#c9b79c",
        deskStroke: "#8a7a5f",
        deskText: "#4a4f57",
        boxStroke: "#3a3d42",
        doorMain: "#2c2f33",
      };

  const svgRef = useRef(null);
  const [view, setView] = useState(() => computeView(bounds));
  const [hoveredId, setHoveredId] = useState(null);
  const drag = useRef({ dragging: false, moved: false, startX: 0, startY: 0, startView: null });

  useEffect(() => {
    setView(computeView(bounds));
  }, [bounds]);

  useEffect(() => {
    const onUp = () => {
      drag.current.dragging = false;
    };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  const aisles = useMemo(
    () => containmentWalls.filter((w) => w.id.endsWith("-roof")),
    [containmentWalls]
  );

  const rowLabels = useMemo(() => {
    const groups = {};
    racks.forEach((r) => {
      const base = r.label.replace(/-\d+$/, "");
      const x = r.position[0];
      const z = r.position[2];
      if (!groups[base]) groups[base] = { label: base, minX: x, z };
      else groups[base].minX = Math.min(groups[base].minX, x);
    });
    return Object.values(groups);
  }, [racks]);

  function onPointerDown(e) {
    drag.current = { dragging: true, moved: false, startX: e.clientX, startY: e.clientY, startView: view };
  }

  function onPointerMove(e) {
    if (!drag.current.dragging) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) drag.current.moved = true;
    if (!drag.current.moved || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sv = drag.current.startView;
    const scaleX = sv.w / rect.width;
    const scaleY = sv.h / rect.height;
    setView({ x: sv.x - dx * scaleX, y: sv.y - dy * scaleY, w: sv.w, h: sv.h });
  }

  function onPointerUp() {
    drag.current.dragging = false;
  }

  function onClickCapture(e) {
    if (drag.current.moved) {
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  // Attached as a native (non-passive) listener — React binds onWheel as
  // passive by default, which silently breaks preventDefault() and would
  // otherwise let the page scroll while zooming the plan.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const base = computeView(bounds);
      const minW = base.w * 0.2;
      const maxW = base.w * 3;
      const factor = Math.pow(1.0015, e.deltaY);
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      setView((v) => {
        const newW = Math.min(maxW, Math.max(minW, v.w * factor));
        const newH = newW * (v.h / v.w);
        const worldX = v.x + px * v.w;
        const worldY = v.y + py * v.h;
        return { x: worldX - px * newW, y: worldY - py * newH, w: newW, h: newH };
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [bounds]);

  const strokeUnit = view.w / 500;

  return (
    <div
      className="floor-plan-2d"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <svg ref={svgRef} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} width="100%" height="100%">
        <rect x={view.x - 50} y={view.y - 50} width={view.w + 100} height={view.h + 100} fill={theme.background} />

        <GridLines bounds={bounds} color={theme.grid} />

        {/* Office / NOC floor accent */}
        <rect
          x={officeFloor.center[0] - officeFloor.size[0] / 2}
          y={officeFloor.center[1] - officeFloor.size[1] / 2}
          width={officeFloor.size[0]}
          height={officeFloor.size[1]}
          fill={theme.officeFloor}
        />

        {/* Slim perimeter border marking the building's footprint */}
        {hallWalls.map((w) => (
          <rect
            key={w.id}
            x={w.position[0] - w.size[0] / 2}
            y={w.position[2] - w.size[2] / 2}
            width={w.size[0]}
            height={w.size[2]}
            fill={theme.hallWall}
          />
        ))}

        {/* Cold-aisle containment footprints */}
        {aisles.map((a) => (
          <g key={a.id}>
            <rect
              x={a.position[0] - a.size[0] / 2}
              y={a.position[2] - a.size[2] / 2}
              width={a.size[0]}
              height={a.size[2]}
              fill="#5b8fd6"
              opacity={0.18}
            />
            <text
              x={a.position[0] - a.size[0] / 2 + 0.3}
              y={a.position[2] - a.size[2] / 2 + 0.55}
              fontSize={0.42}
              fill={theme.aisleText}
              fontWeight="600"
            >
              {a.label.replace(" — Containment Roof", "")}
            </text>
          </g>
        ))}

        {/* Security cage boundary (dashed = fencing) */}
        <rect
          x={cageBounds.xMin}
          y={cageBounds.zMin}
          width={cageBounds.xMax - cageBounds.xMin}
          height={cageBounds.zMax - cageBounds.zMin}
          fill="none"
          stroke={theme.cageStroke}
          strokeWidth={strokeUnit * 3}
          strokeDasharray="0.35 0.2"
        />

        {rowLabels.map((r) => (
          <text
            key={r.label}
            x={r.minX - 0.9}
            y={r.z + 0.15}
            fontSize={0.4}
            fill={theme.rowLabel}
            textAnchor="end"
            fontWeight="600"
          >
            {r.label}
          </text>
        ))}

        {racks.map((rack) => (
          <FlatBox
            key={rack.id}
            item={rack}
            fill={heatmapOn ? tempToColor(rack.tempF - environment.tempF) : "#9aa0a6"}
            opacity={faultFilterOn && !rack.hasFault ? 0.15 : 1}
            selected={selectedId === rack.id}
            hovered={hoveredId === rack.id}
            strokeUnit={strokeUnit}
            strokeColor={theme.boxStroke}
            onEnter={() => setHoveredId(rack.id)}
            onLeave={() => setHoveredId(null)}
            onClick={() => onSelect(selectedId === rack.id ? null : rack.id)}
          />
        ))}

        {pduRacks.map((pdu) => (
          <FlatBox
            key={pdu.id}
            item={pdu}
            fill="#e0862c"
            opacity={faultFilterOn ? 0.15 : 1}
            selected={selectedId === pdu.id}
            hovered={hoveredId === pdu.id}
            strokeUnit={strokeUnit}
            strokeColor={theme.boxStroke}
            onEnter={() => setHoveredId(pdu.id)}
            onLeave={() => setHoveredId(null)}
            onClick={() => onSelect(selectedId === pdu.id ? null : pdu.id)}
            label="P"
          />
        ))}

        {cracUnits.map((c) => (
          <g key={c.id} opacity={faultFilterOn ? 0.15 : 1}>
            <FlatBox
              item={c}
              fill="#8a8f96"
              strokeColor={theme.boxStroke}
              selected={selectedId === c.id}
              hovered={hoveredId === c.id}
              strokeUnit={strokeUnit}
              onEnter={() => setHoveredId(c.id)}
              onLeave={() => setHoveredId(null)}
              onClick={() => onSelect(selectedId === c.id ? null : c.id)}
            />
            <circle cx={c.position[0]} cy={c.position[2]} r={c.size[0] * 0.28} fill="none" stroke="#fff" strokeWidth={strokeUnit * 2} />
          </g>
        ))}

        {desks.map((d) => (
          <g key={d.id}>
            <rect
              x={d.position[0] - 0.45}
              y={d.position[2] - 0.45}
              width={0.9}
              height={0.9}
              fill={theme.deskFill}
              stroke={theme.deskStroke}
              strokeWidth={strokeUnit}
            />
            <text x={d.position[0]} y={d.position[2] + 0.75} fontSize={0.32} fill={theme.deskText} textAnchor="middle">
              {d.name}
            </text>
          </g>
        ))}

        {entrances.map((e) => (
          <DoorSymbol key={e.id} entrance={e} strokeUnit={strokeUnit} mainColor={theme.doorMain} />
        ))}
      </svg>
    </div>
  );
}

function FlatBox({ item, fill, opacity = 1, selected, hovered, strokeUnit, strokeColor, onEnter, onLeave, onClick, label }) {
  const x = item.position[0] - item.size[0] / 2;
  const y = item.position[2] - item.size[2] / 2;
  const stroke = selected ? "#2fd97a" : hovered ? "#4da3ff" : strokeColor;

  return (
    <g opacity={opacity}>
      <rect
        x={x}
        y={y}
        width={item.size[0]}
        height={item.size[2]}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? strokeUnit * 5 : strokeUnit * 2}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={onClick}
        style={{ cursor: "pointer" }}
      />
      {label && item.size[0] > 0.6 && (
        <text
          x={item.position[0]}
          y={item.position[2] + 0.14}
          fontSize={0.3}
          fill="#fff"
          textAnchor="middle"
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function DoorSymbol({ entrance, strokeUnit, mainColor }) {
  const [x, z] = entrance.position;
  const w = 1.8;
  const color = entrance.type === "fire" ? "#d1453b" : mainColor;

  return (
    <g>
      <line x1={x - w / 2} y1={z} x2={x + w / 2} y2={z} stroke={color} strokeWidth={strokeUnit * 3} />
      <line x1={x - w / 2} y1={z} x2={x - w / 2} y2={z + w} stroke={color} strokeWidth={strokeUnit * 1.5} />
      <path
        d={`M ${x - w / 2} ${z} A ${w} ${w} 0 0 1 ${x + w / 2} ${z}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeUnit}
        strokeDasharray="0.15 0.12"
        opacity={0.6}
      />
      <text x={x} y={z - 0.35} fontSize={0.36} fill={color} textAnchor="middle" fontWeight="700">
        {entrance.label}
      </text>
    </g>
  );
}

function GridLines({ bounds, color }) {
  const step = 5;
  const startX = Math.floor((bounds.xMin - PAD) / step) * step;
  const endX = Math.ceil((bounds.xMax + PAD) / step) * step;
  const startZ = Math.floor((bounds.zMin - PAD) / step) * step;
  const endZ = Math.ceil((bounds.zMax + PAD) / step) * step;

  const verticals = [];
  for (let x = startX; x <= endX; x += step) verticals.push(x);
  const horizontals = [];
  for (let z = startZ; z <= endZ; z += step) horizontals.push(z);

  return (
    <g stroke={color} strokeWidth={0.02}>
      {verticals.map((x) => (
        <line key={`v${x}`} x1={x} y1={startZ} x2={x} y2={endZ} />
      ))}
      {horizontals.map((z) => (
        <line key={`h${z}`} x1={startX} y1={z} x2={endX} y2={z} />
      ))}
    </g>
  );
}
