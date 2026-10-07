import { useState } from "react";

const TASKS = [
  {
    id: "TSK0182401",
    status: "due-today",
    statusLabel: "Due today",
    title: "Quarterly capacity review — Building 1",
    desc: "Review rack density, power headroom, and cooling capacity across all halls. Due end of quarter.",
    detail: {
      assignee: "D. Kaufman",
      priority: "High",
      due: "Sep 30, 2026",
      checklist: [
        { label: "Rack density audit", done: true },
        { label: "Power headroom report", done: true },
        { label: "Cooling capacity model", done: false },
      ],
    },
  },
  {
    id: "TSK0124124",
    status: "waiting",
    statusLabel: "Waiting 2 days",
    title: "Cabling audit — R-QUI-042 · 24 patch records",
    desc: "Verify physical cable labels against CMDB records for Rack D-04 (R-QUI-042). 24 patch records to check.",
    detail: {
      assignee: "M. Torres",
      priority: "Medium",
      related: "Rack D-04 (R-QUI-042)",
      progress: { done: 9, total: 24, label: "patch records verified" },
    },
    locate: { type: "rack", rule: "firstFault" },
  },
  {
    id: "TSK0125401",
    status: "waiting",
    statusLabel: "Waiting 2 days",
    title: "Verify port labeling — nh-switch-03",
    desc: "Physical port labels on nh-switch-03 to be verified against CMDB. 48 access ports + 2 uplinks.",
    detail: {
      assignee: "S. Patel",
      priority: "Medium",
      related: "nh-switch-03",
      progress: { done: 33, total: 50, label: "ports verified" },
    },
    locate: { type: "rack", rule: "firstOk" },
  },
  {
    id: "TSK0125402",
    status: "waiting",
    statusLabel: "Waiting 2 days",
    title: "Review WO-20260713-21 documentation",
    desc: "",
    detail: {
      assignee: "Unassigned",
      priority: "Low",
      related: "WO-20260713-21",
      note: "Awaiting vendor sign-off before scheduling.",
    },
  },
];

const TABS = [
  { key: "all", label: "All", count: 12 },
  { key: "due-today", label: "Due today", count: 1 },
  { key: "ai", label: "AI Assisted", count: 3 },
  { key: "done", label: "Completed", count: 10 },
];

export default function TaskPanel({ onLocate }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section className="panel-card">
      <div className="panel-card__header">
        <h2>Pending tasks at Building 1</h2>
      </div>

      <div className="tab-row">
        {TABS.map((tab, i) => (
          <button key={tab.key} className={`tab-pill${i === 0 ? " tab-pill--active" : ""}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="task-list">
        {TASKS.map((task) => {
          const expanded = expandedId === task.id;
          const toggle = () => setExpandedId(expanded ? null : task.id);

          return (
            <div key={task.id} className="task-item">
              <div
                className="task-item__header"
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
                <div className="task-item__top">
                  <span className="task-item__id">{task.id}</span>
                  <span className={`task-item__status task-item__status--${task.status}`}>
                    {task.status === "due-today" && <WarnIcon />}
                    {task.status === "waiting" && <ClockIcon />}
                    {task.statusLabel}
                  </span>
                  <ChevronIcon expanded={expanded} />
                  <button
                    className="icon-btn icon-btn--small"
                    aria-label="More"
                    title="More"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <KebabIcon />
                  </button>
                </div>
                <div className="task-item__title">{task.title}</div>
                {task.desc && <div className="task-item__desc">{task.desc}</div>}
              </div>

              {expanded && task.detail && (
                <div className="task-item__detail">
                  <div className="task-item__detail-grid">
                    {task.detail.assignee && (
                      <>
                        <span className="task-item__detail-label">Assignee</span>
                        <span>{task.detail.assignee}</span>
                      </>
                    )}
                    {task.detail.priority && (
                      <>
                        <span className="task-item__detail-label">Priority</span>
                        <span>{task.detail.priority}</span>
                      </>
                    )}
                    {task.detail.related && (
                      <>
                        <span className="task-item__detail-label">Related</span>
                        <span>{task.detail.related}</span>
                      </>
                    )}
                    {task.detail.due && (
                      <>
                        <span className="task-item__detail-label">Due</span>
                        <span>{task.detail.due}</span>
                      </>
                    )}
                  </div>

                  {task.detail.checklist && (
                    <ul className="task-item__checklist">
                      {task.detail.checklist.map((c) => (
                        <li
                          key={c.label}
                          className={`task-item__checklist-item${c.done ? " task-item__checklist-item--done" : ""}`}
                        >
                          <CheckIcon done={c.done} />
                          {c.label}
                        </li>
                      ))}
                    </ul>
                  )}

                  {task.detail.progress && (
                    <div className="task-item__progress">
                      <div className="task-item__progress-bar">
                        <div
                          className="task-item__progress-fill"
                          style={{ width: `${(task.detail.progress.done / task.detail.progress.total) * 100}%` }}
                        />
                      </div>
                      <span className="task-item__progress-label">
                        {task.detail.progress.done}/{task.detail.progress.total} {task.detail.progress.label}
                      </span>
                    </div>
                  )}

                  {task.detail.note && <p className="task-item__detail-note">{task.detail.note}</p>}

                  {task.locate && (
                    <button className="task-item__locate" onClick={() => onLocate(task.locate)}>
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

function WarnIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
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

function KebabIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
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
      style={{ transform: expanded ? "rotate(180deg)" : "none" }}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ done }) {
  return done ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" opacity="0.15" />
      <path d="M8 12.5l2.8 2.8L16.5 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
