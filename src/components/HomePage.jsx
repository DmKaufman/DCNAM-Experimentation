import { useMemo, useState } from "react";
import { SITES, classifyHallCapacity } from "../scene/data";
import DataImportPanel from "./DataImportPanel";

// Same ASHRAE-style band used elsewhere (EnvironmentHud) — a hall whose
// average reading has drifted outside it is worth flagging even with zero
// faulted racks.
const TEMP_MIN = 68;
const TEMP_MAX = 77;

const STATUS_RANK = { critical: 0, attention: 1, normal: 2 };
const STATUS_LABEL = { critical: "Critical", attention: "Attention", normal: "Normal" };

// Thresholds are on the *percentage* of a hall's racks faulted, not the raw
// count — hall sizes here range from 20 to 84 racks, so a fixed count like
// ">= 7" would flag every large hall as critical regardless of how healthy
// it actually is, and never flag a small hall no matter how bad its rate is.
function classify(faultPct, tempF) {
  const tempOut = tempF < TEMP_MIN || tempF > TEMP_MAX;
  if (faultPct >= 20) return "critical";
  if (faultPct >= 8 || tempOut) return "attention";
  return "normal";
}

function buildHallSummaries(overviews) {
  const rows = overviews.map((o) => {
    const tempOut = o.tempF < TEMP_MIN || o.tempF > TEMP_MAX;
    return {
      ...o,
      faultPct: Math.round(o.faultPct),
      tempOut,
      status: classify(o.faultPct, o.tempF),
      capacity: classifyHallCapacity(o.capacity),
    };
  });
  rows.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.faultCount - a.faultCount);
  return rows;
}

export default function HomePage({ onSelectHall, overviews, showImport, onImportToggle }) {
  const [filter, setFilter] = useState(null); // null | "attention" | "faults"

  const halls = useMemo(() => buildHallSummaries(overviews), [overviews]);
  const totalFaults = useMemo(() => halls.reduce((sum, h) => sum + h.faultCount, 0), [halls]);
  const needsAttention = useMemo(() => halls.filter((h) => h.status !== "normal").length, [halls]);
  const buildingCount = SITES.length;

  const filteredHalls = useMemo(() => {
    if (filter === "attention") return halls.filter((h) => h.status !== "normal");
    if (filter === "faults") return halls.filter((h) => h.faultCount > 0);
    return halls;
  }, [halls, filter]);

  if (showImport) {
    return (
      <div className="home-page">
        <DataImportPanel onImportComplete={() => onImportToggle?.(false)} />
        <button className="home-page__back-btn" onClick={() => onImportToggle?.(false)}>← Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-page__summary">
        <SummaryStat value={buildingCount} label="Buildings" onClick={() => setFilter(null)} />
        <SummaryStat value={halls.length} label="Halls" onClick={() => setFilter(null)} />
        <SummaryStat
          value={needsAttention}
          label="Need attention"
          tone={needsAttention > 0 ? "warn" : "ok"}
          onClick={() => setFilter("attention")}
          active={filter === "attention"}
        />
        <SummaryStat
          value={totalFaults}
          label="Faulted racks"
          tone={totalFaults > 0 ? "warn" : "ok"}
          onClick={() => setFilter("faults")}
          active={filter === "faults"}
        />
      </div>

      <h2 className="home-page__section-title">
        {filter === "attention" ? "Halls needing attention" : filter === "faults" ? "Halls with faulted racks" : "Halls ranked by attention needed"}
        {filter && <button className="home-page__clear-filter" onClick={() => setFilter(null)}>Clear filter</button>}
      </h2>

      <div className="home-page__grid">
        {filteredHalls.map((h) => (
          <button
            key={`${h.siteId}-${h.hallId}`}
            className={`home-hall-card home-hall-card--${h.status}`}
            onClick={() => onSelectHall(h.siteId, h.hallId)}
          >
            <div className="home-hall-card__top">
              <StatusBadge status={h.status} />
              <span className="home-hall-card__racks">{h.rackCount} racks</span>
            </div>

            <div className="home-hall-card__name">
              <BuildingIcon />
              {h.siteName} — {h.hallLabel}
            </div>
            <div className="home-hall-card__location">
              {h.siteLocation} · {h.pduCount} PDUs · {h.cracCount} CRACs
            </div>

            <div className="home-hall-card__stats">
              <span className={`home-hall-card__fault${h.status !== "normal" ? " home-hall-card__fault--warn" : ""}`}>
                {h.status !== "normal" && <WarnIcon />}
                {h.faultCount > 0 ? `${h.faultCount} faulted (${h.faultPct}%)` : "No faults"}
              </span>
              <span className={`home-hall-card__env${h.tempOut ? " home-hall-card__env--warn" : ""}`}>
                {h.tempF.toFixed(1)}°F · {Math.round(h.humidity)}% RH
              </span>
            </div>

            <div className="home-hall-card__divider" />

            <div className="home-hall-card__capacity">
              <span className="home-hall-card__capacity-label">{h.capacity.worstDimensionLabel}</span>
              <div className="home-hall-card__capacity-bar">
                <div
                  className={`home-hall-card__capacity-fill home-hall-card__capacity-fill--${h.capacity.status}`}
                  style={{ width: `${Math.min(100, h.capacity.worstPressure * 100)}%` }}
                />
              </div>
              <span className="home-hall-card__capacity-pct">{Math.round(h.capacity.worstPressure * 100)}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryStat({ value, label, tone, onClick, active }) {
  return (
    <button
      className={`home-summary-stat${tone ? ` home-summary-stat--${tone}` : ""}${active ? " home-summary-stat--active" : ""}`}
      onClick={onClick}
    >
      <div className="home-summary-stat__value">{value}</div>
      <div className="home-summary-stat__label">{label}</div>
    </button>
  );
}

function StatusBadge({ status }) {
  return <span className={`home-status-badge home-status-badge--${status}`}>{STATUS_LABEL[status]}</span>;
}

function BuildingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="home-hall-card__icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M4 21V7l8-4 8 4v14M4 21h16M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path
        d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
