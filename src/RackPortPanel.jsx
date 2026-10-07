import { useState } from "react";
import NodeMap from "./NodeMap";

const LEGEND = [
  { status: "connected", label: "Connected" },
  { status: "uplink", label: "Uplink" },
  { status: "free", label: "Free" },
  { status: "faulted", label: "Faulted" },
];

function portTitle(p) {
  if (p.status === "free") return `Port ${p.number} · free`;
  return `Port ${p.number} · ${p.device} · ${p.speed}${p.note ? " · " + p.note : ""}`;
}

export default function RackPortPanel({ rack, darkMode }) {
  const [tab, setTab] = useState("list");
  const used = rack.ports.filter((p) => p.status !== "free").length;
  const total = rack.ports.length;
  const inUse = rack.ports.filter((p) => p.status !== "free");

  return (
    <div className="port-panel">
      <div className="port-panel__tabs">
        <button className={`tab-pill${tab === "list" ? " tab-pill--active" : ""}`} onClick={() => setTab("list")}>
          List
        </button>
        <button className={`tab-pill${tab === "map" ? " tab-pill--active" : ""}`} onClick={() => setTab("map")}>
          Node Map
        </button>
      </div>

      {tab === "map" ? (
        <NodeMap rack={rack} darkMode={darkMode} />
      ) : (
        <>
          <div className="port-summary">
            <span>
              {used}/{total} ports in use
            </span>
            <span className="port-summary__temp">{rack.tempF.toFixed(1)}°F</span>
            <span className="port-summary__pct">{Math.round((used / total) * 100)}%</span>
          </div>

          <div className="port-grid">
            {rack.ports.map((p) => (
              <div key={p.number} className={`port-cell port-cell--${p.status}`} title={portTitle(p)} />
            ))}
          </div>

          <div className="port-legend">
            {LEGEND.map((l) => (
              <span key={l.status} className="port-legend__item">
                <span className={`port-legend__dot port-legend__dot--${l.status}`} />
                {l.label}
              </span>
            ))}
          </div>

          <div className="port-list">
            {inUse.map((p) => (
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
        </>
      )}
    </div>
  );
}
