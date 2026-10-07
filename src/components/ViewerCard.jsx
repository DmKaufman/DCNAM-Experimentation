import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "../scene/Scene";
import FloorPlan2D from "../scene/FloorPlan2D";
import { generateLayout } from "../scene/data";
import RackPortPanel from "../RackPortPanel";
import EnvironmentHud from "../EnvironmentHud";

// Resolves a locate "hint" (from a task/activity's Locate button) against
// whatever hall is actually on screen. Indexes are clamped rather than
// trusted, since the same hint is reused across halls of very different
// sizes — a fixed index that's safe on an 84-rack hall shouldn't be able to
// break on a 20-rack one.
function resolveLocateTarget(layout, hint) {
  if (!hint) return null;
  const pick = (arr, i) => (arr.length ? arr[((i % arr.length) + arr.length) % arr.length] : null);

  // A search result already knows the exact id it wants — no rule/index
  // guessing needed, just confirm it actually exists in this hall.
  if (hint.id) {
    const arr = hint.type === "pdu" ? layout.pduRacks : hint.type === "crac" ? layout.cracUnits : layout.racks;
    return arr.find((item) => item.id === hint.id)?.id ?? null;
  }

  if (hint.type === "rack") {
    if (hint.rule === "firstFault") {
      return layout.racks.find((r) => r.hasFault)?.id ?? pick(layout.racks, 0)?.id ?? null;
    }
    if (hint.rule === "firstOk") {
      return layout.racks.find((r) => !r.hasFault)?.id ?? pick(layout.racks, 0)?.id ?? null;
    }
    return pick(layout.racks, hint.index ?? 0)?.id ?? null;
  }
  if (hint.type === "pdu") return pick(layout.pduRacks, hint.index ?? 0)?.id ?? null;
  if (hint.type === "crac") return pick(layout.cracUnits, hint.index ?? 0)?.id ?? null;
  return null;
}

export default function ViewerCard({ site, hallId, onSelectHall, darkMode, pendingLocate, onLocateHandled }) {
  const [selectedId, setSelectedId] = useState(null);
  const [hallMenuOpen, setHallMenuOpen] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [faultFilterOn, setFaultFilterOn] = useState(false);
  const [viewMode, setViewMode] = useState("3d");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  const hall = useMemo(() => site.halls.find((h) => h.id === hallId) ?? site.halls[0], [site, hallId]);
  const layout = useMemo(() => generateLayout(hall), [hall]);

  const allProps = useMemo(
    () => [...layout.racks, ...layout.pduRacks, ...layout.containmentWalls, ...layout.cracUnits],
    [layout]
  );

  const faultCount = useMemo(() => layout.racks.filter((r) => r.hasFault).length, [layout]);

  // A rack selected in the previous hall won't exist in the new one.
  useEffect(() => {
    setSelectedId(null);
  }, [site.id, hallId]);

  // A task/activity asked us to locate something. Resolve it against the
  // current hall, select it, and make sure 3D view is active so the
  // fly-to camera actually has something to fly to.
  useEffect(() => {
    if (!pendingLocate) return;
    const targetId = resolveLocateTarget(layout, pendingLocate);
    if (targetId) {
      setSelectedId(targetId);
      setViewMode("3d");
    }
    onLocateHandled();
  }, [pendingLocate, layout, onLocateHandled]);

  const selected = useMemo(() => allProps.find((p) => p.id === selectedId) ?? null, [allProps, selectedId]);

  return (
    <div className="viewer-card">
      <div className="viewer-card__toolbar">
        <div className="viewer-card__title-wrap">
          <button className="viewer-card__title-btn" onClick={() => setHallMenuOpen((o) => !o)}>
            <span className="viewer-card__title">
              Racks in {hall.label} <span className="viewer-card__badge">{layout.racks.length}</span>
            </span>
            <ChevronDown />
          </button>

          {hallMenuOpen && (
            <>
              <div className="dropdown-overlay" onClick={() => setHallMenuOpen(false)} />
              <div className="site-dropdown">
                <div className="site-dropdown__label">Switch hall</div>
                {site.halls.map((h) => (
                  <button
                    key={h.id}
                    className={`site-dropdown__item${h.id === hall.id ? " site-dropdown__item--active" : ""}`}
                    onClick={() => {
                      onSelectHall(h.id);
                      setHallMenuOpen(false);
                    }}
                  >
                    <span className="site-dropdown__name">{h.label}</span>
                    <span className="site-dropdown__location">{h.racksPerRow * h.aislePairs * 2} racks</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="viewer-card__actions">
          <button className="icon-btn" title="Search" aria-label="Search">
            <SearchIcon />
          </button>
          <button className="icon-btn" title="Filter" aria-label="Filter">
            <FilterIcon />
          </button>
          <button className="icon-btn" title="Sort" aria-label="Sort">
            <SlidersIcon />
          </button>
          <span className="viewer-card__divider" />
          <button
            className={`pill-btn${heatmapOn ? " pill-btn--dark" : ""}`}
            onClick={() => setHeatmapOn((o) => !o)}
          >
            <ThermoIcon /> Heatmap
          </button>
          <button
            className={`pill-btn${faultFilterOn ? " pill-btn--danger" : ""}`}
            onClick={() => setFaultFilterOn((o) => !o)}
            disabled={faultCount === 0}
          >
            <WarnIcon /> Faults{faultCount > 0 ? ` (${faultCount})` : ""}
          </button>
          <div className="view-mode-wrap">
            <button className="pill-btn" onClick={() => setViewMenuOpen((o) => !o)}>
              {viewMode === "2d" ? "2D View" : "3D View"} <ChevronDown />
            </button>

            {viewMenuOpen && (
              <>
                <div className="dropdown-overlay" onClick={() => setViewMenuOpen(false)} />
                <div className="site-dropdown site-dropdown--right">
                  <div className="site-dropdown__label">View mode</div>
                  <button
                    className={`site-dropdown__item${viewMode === "3d" ? " site-dropdown__item--active" : ""}`}
                    onClick={() => {
                      setViewMode("3d");
                      setViewMenuOpen(false);
                    }}
                  >
                    <span className="site-dropdown__name">3D View</span>
                    <span className="site-dropdown__location">Rotate, pan &amp; zoom freely</span>
                  </button>
                  <button
                    className={`site-dropdown__item${viewMode === "2d" ? " site-dropdown__item--active" : ""}`}
                    onClick={() => {
                      setViewMode("2d");
                      setViewMenuOpen(false);
                    }}
                  >
                    <span className="site-dropdown__name">2D View</span>
                    <span className="site-dropdown__location">Top-down floor plan</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button className="pill-btn pill-btn--dark">New</button>
          <button className="icon-btn" title="More" aria-label="More">
            <KebabIcon />
          </button>
        </div>
      </div>

      <div className="viewer-card__hint">
        {viewMode === "2d"
          ? "Drag to pan · scroll to zoom · click a rack for details"
          : "Drag to rotate · scroll to zoom · right-click to pan · click a rack for details"}
      </div>

      <div className="viewer-card__stage">
        {viewMode === "2d" ? (
          <FloorPlan2D
            layout={layout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            heatmapOn={heatmapOn}
            faultFilterOn={faultFilterOn}
            darkMode={darkMode}
          />
        ) : (
          <Canvas shadows dpr={[1, 2]}>
            <Scene
              layout={layout}
              selectedId={selectedId}
              onSelect={setSelectedId}
              heatmapOn={heatmapOn}
              faultFilterOn={faultFilterOn}
              darkMode={darkMode}
            />
          </Canvas>
        )}

        <EnvironmentHud reading={layout.environment} cracUnits={layout.cracUnits} />

        {heatmapOn && (
          <div className="heatmap-legend">
            <span>Cool</span>
            <span className="heatmap-legend__bar" />
            <span>Hot</span>
          </div>
        )}

        {selected && (
          <aside className={`info-panel${selected.ports ? " info-panel--wide" : ""}`}>
            <div className="info-panel__header">
              <span>{selected.label}</span>
              <button onClick={() => setSelectedId(null)} aria-label="Close">
                ×
              </button>
            </div>

            {selected.ports ? (
              <RackPortPanel rack={selected} darkMode={darkMode} />
            ) : (
              <dl>
                <dt>ID</dt>
                <dd>{selected.id}</dd>
                <dt>Position</dt>
                <dd>{selected.position.map((n) => n.toFixed(1)).join(", ")}</dd>
                <dt>Size (W × H × D)</dt>
                <dd>{selected.size.map((n) => n.toFixed(1)).join(" × ")}</dd>
              </dl>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function ThermoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M14 14.76V3.5a2 2 0 0 0-4 0v11.26a4 4 0 1 0 4 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path
        d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 6h14M5 12h14M5 18h14" strokeLinecap="round" />
      <circle cx="9" cy="6" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function KebabIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
