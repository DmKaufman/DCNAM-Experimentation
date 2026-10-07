import { useMemo, useState } from "react";
import { CAPACITY_CEILINGS, pressureStatus, classifyHallCapacity } from "../scene/data";

const TEMP_MIN = 68;
const TEMP_MAX = 77;

function hallKey(o) {
  return `${o.siteId}-${o.hallId}`;
}

// Lower is always better for these three — all three are expressed as
// "how much of this resource is in use," the same convention the Capacity
// page uses, so a straight numeric comparison is meaningful across all of
// them without needing a per-row sign flip.
function lowerIsBetter(a, b) {
  if (a === b) return null;
  return a < b ? "a" : "b";
}

export default function ComparePage({ overviews, onSelectHall }) {
  const [aKey, setAKey] = useState(() => defaultPair(overviews)[0]);
  const [bKey, setBKey] = useState(() => defaultPair(overviews)[1]);

  const hallA = overviews.find((o) => hallKey(o) === aKey) ?? overviews[0];
  const hallB = overviews.find((o) => hallKey(o) === bKey) ?? overviews[1] ?? overviews[0];

  const capA = useMemo(() => classifyHallCapacity(hallA.capacity), [hallA]);
  const capB = useMemo(() => classifyHallCapacity(hallB.capacity), [hallB]);

  const tempOutA = hallA.tempF < TEMP_MIN || hallA.tempF > TEMP_MAX;
  const tempOutB = hallB.tempF < TEMP_MIN || hallB.tempF > TEMP_MAX;

  const rackPressureA = hallA.capacity.portUtilPct / CAPACITY_CEILINGS.rack;
  const rackPressureB = hallB.capacity.portUtilPct / CAPACITY_CEILINGS.rack;
  const powerPressureA = (100 - hallA.capacity.powerHeadroomPct) / CAPACITY_CEILINGS.power;
  const powerPressureB = (100 - hallB.capacity.powerHeadroomPct) / CAPACITY_CEILINGS.power;
  const coolingPressureA = (100 - hallA.capacity.coolingHeadroomPct) / CAPACITY_CEILINGS.cooling;
  const coolingPressureB = (100 - hallB.capacity.coolingHeadroomPct) / CAPACITY_CEILINGS.cooling;

  return (
    <div className="compare-page">
      <p className="compare-page__intro">
        Compare two halls side by side to decide where to prioritize budget, staffing, or
        maintenance.
      </p>

      <div className="compare-grid">
        <HallHeader hall={hallA} overviews={overviews} otherKey={bKey} selectedKey={aKey} onChange={setAKey} />
        <div className="compare-grid__vs">VS</div>
        <HallHeader hall={hallB} overviews={overviews} otherKey={aKey} selectedKey={bKey} onChange={setBKey} />

        <CompareRow label="Racks" valueA={hallA.rackCount} valueB={hallB.rackCount} />
        <CompareRow label="PDUs / CRACs" valueA={`${hallA.pduCount} / ${hallA.cracCount}`} valueB={`${hallB.pduCount} / ${hallB.cracCount}`} />

        <CompareRow
          label="Faulted racks"
          valueA={`${hallA.faultCount} (${Math.round(hallA.faultPct)}%)`}
          valueB={`${hallB.faultCount} (${Math.round(hallB.faultPct)}%)`}
          winner={lowerIsBetter(hallA.faultPct, hallB.faultPct)}
        />
        <CompareRow
          label="Temperature"
          valueA={`${hallA.tempF.toFixed(1)}°F`}
          valueB={`${hallB.tempF.toFixed(1)}°F`}
          warnA={tempOutA}
          warnB={tempOutB}
        />
        <CompareRow
          label="Humidity"
          valueA={`${Math.round(hallA.humidity)}% RH`}
          valueB={`${Math.round(hallB.humidity)}% RH`}
        />

        <div className="compare-grid__divider" />

        <CompareRow
          label="Rack space used"
          valueA={`${hallA.capacity.portUtilPct}%`}
          valueB={`${hallB.capacity.portUtilPct}%`}
          winner={lowerIsBetter(rackPressureA, rackPressureB)}
        />
        <CompareRow
          label="Power draw"
          valueA={`${hallA.capacity.powerDrawKw} / ${hallA.capacity.powerCapacityKw} kW`}
          valueB={`${hallB.capacity.powerDrawKw} / ${hallB.capacity.powerCapacityKw} kW`}
          winner={lowerIsBetter(powerPressureA, powerPressureB)}
        />
        <CompareRow
          label="Cooling load"
          valueA={`${hallA.capacity.coolingLoadKw} / ${hallA.capacity.coolingCapacityKw} kW`}
          valueB={`${hallB.capacity.coolingLoadKw} / ${hallB.capacity.coolingCapacityKw} kW`}
          winner={lowerIsBetter(coolingPressureA, coolingPressureB)}
        />
        <CompareRow
          label="Capacity status"
          valueA={<StatusPill status={capA.status} />}
          valueB={<StatusPill status={capB.status} />}
        />

        <div className="compare-grid__actions">
          <button className="pill-btn pill-btn--dark" onClick={() => onSelectHall(hallA.siteId, hallA.hallId)}>
            View {hallA.siteName} — {hallA.hallLabel}
          </button>
        </div>
        <div />
        <div className="compare-grid__actions">
          <button className="pill-btn pill-btn--dark" onClick={() => onSelectHall(hallB.siteId, hallB.hallId)}>
            View {hallB.siteName} — {hallB.hallLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Defaults to the two halls at opposite ends of the fault spectrum, so the
// page shows something illustrative on first load instead of two arbitrary
// (possibly identical-looking) halls.
function defaultPair(overviews) {
  const sorted = [...overviews].sort((a, b) => b.faultPct - a.faultPct);
  const a = sorted[0];
  const b = sorted[sorted.length - 1];
  return [hallKey(a), hallKey(b)];
}

function HallHeader({ hall, overviews, otherKey, selectedKey, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="compare-header">
      <button className="compare-header__picker" onClick={() => setOpen((o) => !o)}>
        <span className="compare-header__name">
          {hall.siteName} — {hall.hallLabel}
        </span>
        <ChevronDown />
      </button>
      <div className="compare-header__location">{hall.siteLocation}</div>

      {open && (
        <>
          <div className="dropdown-overlay" onClick={() => setOpen(false)} />
          <div className="site-dropdown">
            <div className="site-dropdown__label">Choose a hall</div>
            {overviews.map((o) => {
              const key = hallKey(o);
              return (
                <button
                  key={key}
                  className={`site-dropdown__item${key === selectedKey ? " site-dropdown__item--active" : ""}`}
                  disabled={key === otherKey}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                >
                  <span className="site-dropdown__name">
                    {o.siteName} — {o.hallLabel}
                  </span>
                  <span className="site-dropdown__location">{o.siteLocation}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CompareRow({ label, valueA, valueB, winner, warnA, warnB }) {
  return (
    <>
      <div className={`compare-row__value compare-row__value--left${winner === "a" ? " compare-row__value--winner" : ""}`}>
        <span className={warnA ? "compare-row__value-text--warn" : undefined}>{valueA}</span>
        {winner === "a" && <WinnerIcon />}
      </div>
      <div className="compare-row__label">{label}</div>
      <div className={`compare-row__value compare-row__value--right${winner === "b" ? " compare-row__value--winner" : ""}`}>
        {winner === "b" && <WinnerIcon />}
        <span className={warnB ? "compare-row__value-text--warn" : undefined}>{valueB}</span>
      </div>
    </>
  );
}

function StatusPill({ status }) {
  const cls = status === "constrained" ? "critical" : status === "watch" ? "attention" : "normal";
  const label = status === "constrained" ? "Constrained" : status === "watch" ? "Watch" : "Healthy";
  return <span className={`home-status-badge home-status-badge--${cls}`}>{label}</span>;
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WinnerIcon() {
  return (
    <svg aria-hidden="true" className="compare-row__winner-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
