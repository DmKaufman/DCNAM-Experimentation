import { useEffect, useRef, useState } from "react";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Stable per-CRAC offset from the hall average — each unit reads a little
// differently but consistently, rather than all showing the exact same
// number (which would look fake) or jumping around independently. A plain
// polynomial hash has weak avalanche for near-identical inputs like
// "crac-01" vs "crac-02" (they'd land within thousandths of each other),
// so the raw hash is run through one mulberry32 mixing step to actually
// spread sequential ids apart.
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

function mixToUnitFloat(seed) {
  let a = seed | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function craqOffset(id, range = 1.5) {
  const frac = mixToUnitFloat(hashCode(id));
  return (frac - 0.5) * 2 * range;
}

// Small live-feeling readout, corner-anchored over the 3D view. Values
// start from the site's stable dummy reading and drift gently so the panel
// doesn't look frozen, without pretending to be a real sensor feed. Click
// to drill into a range view, a trend, and the individual CRAC units
// feeding that average.
export default function EnvironmentHud({ reading, cracUnits = [] }) {
  const [env, setEnv] = useState(reading);
  const [expanded, setExpanded] = useState(false);
  const historyRef = useRef([reading.tempF]);

  useEffect(() => {
    setEnv(reading);
    setExpanded(false);
    historyRef.current = [reading.tempF];

    const interval = setInterval(() => {
      setEnv((prev) => {
        const next = {
          tempF: clamp(prev.tempF + (Math.random() - 0.5) * 0.3, 66, 78),
          humidity: clamp(prev.humidity + (Math.random() - 0.5) * 1.5, 35, 60),
        };
        historyRef.current = [...historyRef.current.slice(-19), next.tempF];
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [reading]);

  return (
    <div className="env-hud-wrap">
      <button className="env-hud" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
        <div className="env-hud__stat">
          <ThermoIcon />
          <span>{env.tempF.toFixed(1)}°F</span>
        </div>
        <div className="env-hud__divider" />
        <div className="env-hud__stat">
          <DropletIcon />
          <span>{Math.round(env.humidity)}% RH</span>
        </div>
        <span className="env-hud__status">Normal</span>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded && (
        <>
          <div className="dropdown-overlay" onClick={() => setExpanded(false)} />
          <div className="env-hud-popover">
            <div className="env-hud-popover__title">White Space Environment</div>

            <RangeBar label="Temperature" value={env.tempF} min={60} max={85} recMin={68} recMax={77} unit="°F" />
            <Sparkline data={historyRef.current} />

            <RangeBar label="Humidity" value={env.humidity} min={20} max={70} recMin={40} recMax={55} unit="%" />

            {cracUnits.length > 0 && (
              <div className="env-hud-popover__cracs">
                <div className="env-hud-popover__cracs-label">Cooling units</div>
                {cracUnits.map((c) => {
                  const t = env.tempF + craqOffset(c.id);
                  const elevated = t - env.tempF > 0.9;
                  return (
                    <div key={c.id} className="env-hud-popover__crac-row">
                      <span>{c.label}</span>
                      <span className={elevated ? "env-hud-popover__crac-value--warn" : ""}>{t.toFixed(1)}°F</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RangeBar({ label, value, min, max, recMin, recMax, unit }) {
  const pct = (v) => clamp(((v - min) / (max - min)) * 100, 0, 100);
  const inRange = value >= recMin && value <= recMax;

  return (
    <div className="env-hud-range">
      <div className="env-hud-range__top">
        <span className="env-hud-range__label">{label}</span>
        <span className={`env-hud-range__value${inRange ? "" : " env-hud-range__value--warn"}`}>
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="env-hud-range__track">
        <div
          className="env-hud-range__band"
          style={{ left: `${pct(recMin)}%`, width: `${pct(recMax) - pct(recMin)}%` }}
        />
        <div className="env-hud-range__marker" style={{ left: `${pct(value)}%` }} />
      </div>
      <div className="env-hud-range__ends">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

function Sparkline({ data }) {
  if (data.length < 2) return <div className="env-hud-sparkline-placeholder" />;

  const w = 100;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 0.5);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="env-hud-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
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

function DropletIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3s6 6.5 6 10.5a6 6 0 1 1-12 0C6 9.5 12 3 12 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
