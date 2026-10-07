import { useMemo, useState } from "react";

const ROOT_HALF = 0.5;
const CHILD_HALF = 0.42;
const CHILD_SPACING = 1.55;
const TRUNK_DROP = 0.85;
const ROW_Y = 2.55;

// Groups connected ports by device type (so a rack with 20 web servers
// reads as one node, not 20), while uplinks and faults — the ones you'd
// actually want to click into — stay individual.
function buildNodes(ports) {
  const byType = {};
  const nodes = [];

  ports.forEach((p) => {
    if (p.status === "free") return;
    if (p.status === "uplink" || p.status === "faulted") {
      nodes.push({
        id: `p-${p.number}`,
        kind: p.status,
        label: p.device,
        color: p.status === "uplink" ? "#4da3ff" : "#e5484d",
        ports: [p],
      });
      return;
    }
    const type = p.device.split("-")[0];
    (byType[type] ??= []).push(p);
  });

  Object.entries(byType).forEach(([type, ps]) => {
    nodes.push({
      id: `type-${type}`,
      kind: "group",
      label: type.charAt(0).toUpperCase() + type.slice(1),
      color: "#3aa76d",
      ports: ps,
    });
  });

  return nodes;
}

export default function NodeMap({ rack, darkMode }) {
  const [activeId, setActiveId] = useState(null);
  const trunkColor = darkMode ? "#4a4f57" : "#c9c9c7";
  const labelColor = darkMode ? "#d7dae0" : "#3a3d42";
  const selectedStroke = darkMode ? "#f4f4f2" : "#1a1a1a";

  const nodes = useMemo(() => buildNodes(rack.ports), [rack]);

  if (nodes.length === 0) {
    return <div className="node-map__empty">No active connections on this rack.</div>;
  }

  const n = nodes.length;
  const positioned = nodes.map((node, i) => ({
    ...node,
    x: (i - (n - 1) / 2) * CHILD_SPACING,
    y: ROW_Y,
  }));

  // The map is a single wide row under the root, so the viewBox just fits
  // the content itself (plus a little breathing room) rather than being
  // forced into some fixed aspect ratio the layout doesn't actually have.
  const vx = Math.min(-ROOT_HALF, positioned[0].x - CHILD_HALF) - 0.6;
  const contentRight = Math.max(ROOT_HALF, positioned[n - 1].x + CHILD_HALF) + 0.6;
  const vy = -ROOT_HALF - 0.5;
  const contentBottom = ROW_Y + CHILD_HALF + 0.6;

  const vw = contentRight - vx;
  const vh = contentBottom - vy;

  const active = positioned.find((p) => p.id === activeId) ?? null;
  const trunkY = ROW_Y - TRUNK_DROP;

  return (
    <div className="node-map">
      <div className="node-map__title">{rack.label} — Top-of-Rack Switch</div>

      <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} width="100%" style={{ aspectRatio: `${vw} / ${vh}` }}>
        {/* Backbone: root down to a shared trunk, then out to each child */}
        <line x1={0} y1={ROOT_HALF} x2={0} y2={trunkY} stroke={trunkColor} strokeWidth={0.05} />
        <line
          x1={positioned[0].x}
          y1={trunkY}
          x2={positioned[n - 1].x}
          y2={trunkY}
          stroke={trunkColor}
          strokeWidth={0.05}
        />
        {positioned.map((node) => (
          <line
            key={`drop-${node.id}`}
            x1={node.x}
            y1={trunkY}
            x2={node.x}
            y2={node.y - CHILD_HALF}
            stroke={node.color}
            strokeWidth={node.id === activeId ? 0.09 : 0.05}
            opacity={!activeId || node.id === activeId ? 0.85 : 0.3}
          />
        ))}

        <RootAvatar />

        {positioned.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onClick={() => setActiveId((id) => (id === node.id ? null : node.id))}
            style={{ cursor: "pointer" }}
            opacity={!activeId || activeId === node.id ? 1 : 0.4}
          >
            <ChildAvatar node={node} selected={activeId === node.id} selectedStroke={selectedStroke} />
            <text
              y={CHILD_HALF + 0.38}
              fontSize={0.26}
              fill={labelColor}
              textAnchor="middle"
              fontWeight={node.kind === "group" ? 600 : 400}
            >
              {node.kind === "group" ? `${node.label} (${node.ports.length})` : node.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="port-legend">
        <span className="port-legend__item">
          <span className="port-legend__dot port-legend__dot--connected" /> Device group
        </span>
        <span className="port-legend__item">
          <span className="port-legend__dot port-legend__dot--uplink" /> Uplink
        </span>
        <span className="port-legend__item">
          <span className="port-legend__dot port-legend__dot--faulted" /> Faulted
        </span>
      </div>

      {active && (
        <div className="node-map__detail">
          <div className="node-map__detail-header">{active.label}</div>
          {active.ports.map((p) => (
            <div key={p.number} className="port-list__row">
              <span className={`port-list__dot port-list__dot--${p.status}`} />
              <span className="port-list__port">P{String(p.number).padStart(2, "0")}</span>
              <span className="port-list__device">{p.device}</span>
              <span className="port-list__speed">
                {p.speed}
                {p.note ? ` · ${p.note}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Root avatar: the rack's top-of-rack switch, drawn as a rounded-square
// icon tile matching the "avatar with corner status badge" convention real
// CMDB/dependency-map tools use for CI nodes.
function RootAvatar() {
  return (
    <g>
      <rect
        x={-ROOT_HALF}
        y={-ROOT_HALF}
        width={ROOT_HALF * 2}
        height={ROOT_HALF * 2}
        rx={0.14}
        fill="#16233d"
      />
      <rect x={-0.32} y={-0.22} width={0.64} height={0.44} rx={0.07} fill="none" stroke="#fff" strokeWidth={0.07} />
      <line x1={-0.17} y1={-0.1} x2={-0.17} y2={0.1} stroke="#fff" strokeWidth={0.07} />
      <line x1={0} y1={-0.1} x2={0} y2={0.1} stroke="#fff" strokeWidth={0.07} />
      <line x1={0.17} y1={-0.1} x2={0.17} y2={0.1} stroke="#fff" strokeWidth={0.07} />
      <circle cx={ROOT_HALF * 0.82} cy={-ROOT_HALF * 0.82} r={0.13} fill="#2fd97a" stroke="#fff" strokeWidth={0.05} />
    </g>
  );
}

function ChildAvatar({ node, selected, selectedStroke }) {
  return (
    <g>
      <rect
        x={-CHILD_HALF}
        y={-CHILD_HALF}
        width={CHILD_HALF * 2}
        height={CHILD_HALF * 2}
        rx={0.12}
        fill={node.color}
        stroke={selected ? selectedStroke : "none"}
        strokeWidth={0.06}
      />
      <NodeGlyph kind={node.kind} />
      <circle
        cx={CHILD_HALF * 0.78}
        cy={-CHILD_HALF * 0.78}
        r={0.11}
        fill={node.color}
        stroke="#fff"
        strokeWidth={0.05}
      />
    </g>
  );
}

function NodeGlyph({ kind }) {
  if (kind === "group") {
    return (
      <g stroke="#fff" strokeWidth={0.06} fill="none">
        <rect x={-0.24} y={-0.24} width={0.48} height={0.13} rx={0.03} />
        <rect x={-0.24} y={-0.065} width={0.48} height={0.13} rx={0.03} />
        <rect x={-0.24} y={0.11} width={0.48} height={0.13} rx={0.03} />
      </g>
    );
  }
  if (kind === "uplink") {
    return (
      <path
        d="M0 0.22 L0 -0.2 M-0.14 -0.02 L0 -0.2 L0.14 -0.02"
        fill="none"
        stroke="#fff"
        strokeWidth={0.07}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  return (
    <g fill="none" stroke="#fff" strokeWidth={0.06} strokeLinejoin="round">
      <path d="M0 -0.24 L0.24 0.18 L-0.24 0.18 Z" />
      <line x1={0} y1={-0.05} x2={0} y2={0.05} strokeLinecap="round" />
      <circle cx={0} cy={0.12} r={0.02} fill="#fff" stroke="none" />
    </g>
  );
}
