import { useMemo } from "react";
import { CAPACITY_CEILINGS, pressureStatus, classifyHallCapacity } from "../scene/data";

const STATUS_RANK = { constrained: 0, watch: 1, healthy: 2 };
const STATUS_LABEL = { constrained: "Constrained", watch: "Watch", healthy: "Healthy" };
// Reuses the Home page's exact critical/attention/normal badge colors
// (already contrast-checked in both themes) instead of inventing a second
// red/orange/green trio that would inevitably drift from the first.
const STATUS_BADGE_CLASS = { constrained: "critical", watch: "attention", healthy: "normal" };

function buildCapacitySummaries(overviews) {
  const rows = overviews.map((o) => {
    const { status, worstPressure } = classifyHallCapacity(o.capacity);
    return { ...o, worstPressure, status };
  });
  rows.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.worstPressure - a.worstPressure);
  return rows;
}

export default function CapacityPage({ onSelectHall, overviews }) {
  const halls = useMemo(() => buildCapacitySummaries(overviews), [overviews]);
  const constrainedCount = useMemo(() => halls.filter((h) => h.status === "constrained").length, [halls]);

  return (
    <div className="capacity-page">
      <p className="capacity-page__intro">
        Rack density, power headroom, and cooling capacity across all halls, ranked by tightest
        constraint. {constrainedCount > 0 ? `${constrainedCount} hall${constrainedCount > 1 ? "s" : ""} need capacity planning now.` : "No halls are capacity-constrained right now."}
      </p>

      <div className="capacity-table">
        <div className="capacity-table__head">
          <span>Hall</span>
          <span>Rack space</span>
          <span>Power</span>
          <span>Cooling</span>
          <span>Status</span>
        </div>

        {halls.map((h) => (
          <button
            key={`${h.siteId}-${h.hallId}`}
            className="capacity-row"
            onClick={() => onSelectHall(h.siteId, h.hallId)}
          >
            <div className="capacity-row__hall">
              <div className="capacity-row__name">
                {h.siteName} — {h.hallLabel}
              </div>
              <div className="capacity-row__location">
                {h.siteLocation} · {h.rackCount} racks
              </div>
            </div>

            <CapacityMetric
              label="Rack space"
              pct={h.capacity.portUtilPct}
              ceiling={CAPACITY_CEILINGS.rack}
              detail={`${h.capacity.portUtilPct}% of ports used`}
            />
            <CapacityMetric
              label="Power"
              pct={100 - h.capacity.powerHeadroomPct}
              ceiling={CAPACITY_CEILINGS.power}
              detail={`${h.capacity.powerDrawKw} / ${h.capacity.powerCapacityKw} kW`}
            />
            <CapacityMetric
              label="Cooling"
              pct={100 - h.capacity.coolingHeadroomPct}
              ceiling={CAPACITY_CEILINGS.cooling}
              detail={`${h.capacity.coolingLoadKw} / ${h.capacity.coolingCapacityKw} kW`}
            />

            <span className={`home-status-badge home-status-badge--${STATUS_BADGE_CLASS[h.status]} capacity-status`}>
              {STATUS_LABEL[h.status]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CapacityMetric({ label, pct, ceiling, detail }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const tone = pressureStatus(clamped / ceiling);
  return (
    <div className="capacity-metric">
      <span className="capacity-metric__label">{label}</span>
      <div className="capacity-metric__bar">
        <div className={`capacity-metric__fill capacity-metric__fill--${tone}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="capacity-metric__detail">{detail}</span>
    </div>
  );
}
