import { useState } from "react";

const ACTIVITY = [
  {
    id: "act-1",
    name: "Sarah Chen",
    initials: "S",
    time: "2h ago",
    text:
      "Hall B-Expansion thermal sensors showing sustained high temps since 09:20. CRAC-2 operating at 94% load. Escalated to facilities team.",
    detail: {
      incidentId: "INC-20260529-0007",
      severity: "High",
      affected: "CRAC-2 · Hall B-Expansion",
      timeline: [
        { label: "Thermal threshold breached", time: "09:20" },
        { label: "Auto-escalated to facilities", time: "09:34" },
        { label: "Technician dispatched", time: "09:52" },
      ],
    },
    locate: { type: "crac", index: 1 },
  },
  {
    id: "act-2",
    name: "Marcus H.",
    initials: "M",
    time: "4h ago",
    text: "Routine power check completed. PDU-A and PDU-B balanced at 48% / 52%. No anomalies on Hall A side.",
    attachment: "power-check-0707.pdf",
    detail: {
      reportId: "PWR-0707-A",
      checklist: ["PDU-A load", "PDU-B load", "Breaker status", "Cable seating"],
    },
    locate: { type: "pdu", index: 0 },
  },
  {
    id: "act-3",
    name: "System",
    initials: "S",
    time: "6h ago",
    text:
      "INC-20260527-0001 resolved. Thermal reading returned to normal after CRAC-1 filter replacement. Hall B readings nominal.",
    detail: {
      incidentId: "INC-20260527-0001",
      severity: "Medium",
      timeline: [
        { label: "Thermal anomaly detected", time: "May 27, 14:02" },
        { label: "CRAC-1 filter flagged", time: "May 27, 14:20" },
        { label: "Filter replaced", time: "May 27, 15:10" },
        { label: "Resolved — readings nominal", time: "May 27, 16:16" },
      ],
    },
    locate: { type: "crac", index: 0 },
  },
];

export default function ActivityPanel({ onLocate }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section className="panel-card">
      <div className="panel-card__header">
        <h2>Activity</h2>
        <ExpandIcon />
      </div>

      <div className="tab-row">
        <span className="tab-row__label">ACTIVITY STREAM</span>
        <div className="tab-row__spacer" />
        <button className="tab-pill">Priority</button>
        <button className="tab-pill tab-pill--active">All (12)</button>
      </div>

      <div className="activity-list">
        {ACTIVITY.map((item) => {
          const expanded = expandedId === item.id;
          const toggle = () => setExpandedId(expanded ? null : item.id);

          return (
            <div key={item.id} className="activity-item-wrap">
              <div
                className="activity-item"
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={toggle}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                  }
                }}
              >
                <div
                  className={`activity-item__avatar${
                    item.name === "System" ? " activity-item__avatar--system" : ""
                  }`}
                >
                  {item.initials}
                </div>
                <div className="activity-item__body">
                  <div className="activity-item__meta">
                    <span className="activity-item__name">{item.name}</span>
                    <span className="activity-item__time">{item.time}</span>
                    {item.detail && <ChevronIcon expanded={expanded} />}
                  </div>
                  <p className="activity-item__text">{item.text}</p>
                  {item.attachment && (
                    <span className="activity-item__attachment">
                      <ClipIcon /> {item.attachment}
                    </span>
                  )}
                </div>
              </div>

              {expanded && item.detail && (
                <div className="activity-item__detail">
                  <div className="activity-item__detail-grid">
                    {item.detail.incidentId && (
                      <>
                        <span className="task-item__detail-label">Incident</span>
                        <span>{item.detail.incidentId}</span>
                      </>
                    )}
                    {item.detail.reportId && (
                      <>
                        <span className="task-item__detail-label">Report</span>
                        <span>{item.detail.reportId}</span>
                      </>
                    )}
                    {item.detail.severity && (
                      <>
                        <span className="task-item__detail-label">Severity</span>
                        <span>{item.detail.severity}</span>
                      </>
                    )}
                    {item.detail.affected && (
                      <>
                        <span className="task-item__detail-label">Affected</span>
                        <span>{item.detail.affected}</span>
                      </>
                    )}
                  </div>

                  {item.detail.timeline && (
                    <ul className="activity-item__timeline">
                      {item.detail.timeline.map((t) => (
                        <li key={t.label} className="activity-item__timeline-item">
                          <span className="activity-item__timeline-dot" />
                          <span className="activity-item__timeline-label">{t.label}</span>
                          <span className="activity-item__timeline-time">{t.time}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.detail.checklist && (
                    <ul className="task-item__checklist">
                      {item.detail.checklist.map((c) => (
                        <li key={c} className="task-item__checklist-item task-item__checklist-item--done">
                          <CheckIcon />
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.locate && (
                    <button className="task-item__locate" onClick={() => onLocate(item.locate)}>
                      <PinIcon /> Locate in 3D model
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExpandIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClipIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M8 12l6.5-6.5a3 3 0 1 1 4.24 4.24L11 17.5a5 5 0 1 1-7.07-7.07L12.5 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className="task-item__chevron"
      style={{ transform: expanded ? "rotate(180deg)" : "none", marginLeft: "auto" }}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" opacity="0.15" />
      <path d="M8 12.5l2.8 2.8L16.5 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path
        d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.3" />
    </svg>
  );
}
