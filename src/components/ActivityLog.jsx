import "../styles/ActivityLog.css";

const SAMPLE_ACTIVITIES = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 2 * 60000), // 2 min ago
    type: "fault",
    title: "Rack fault detected",
    description: "Building 4 - Hall B, Row A-02 reported link down",
    severity: "critical",
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 8 * 60000), // 8 min ago
    type: "update",
    title: "Configuration updated",
    description: "PDU count increased from 10 to 12 in Building 2 - Hall A",
    severity: "info",
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 15 * 60000), // 15 min ago
    type: "alert",
    title: "Temperature warning",
    description: "Building 1 - Hall A exceeded 78°F threshold",
    severity: "warning",
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 32 * 60000), // 32 min ago
    type: "import",
    title: "Data imported",
    description: "Imported 8 halls from CSV file",
    severity: "info",
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 58 * 60000), // 58 min ago
    type: "resolved",
    title: "Issue resolved",
    description: "Building 3 - Hall B cooling issue resolved",
    severity: "success",
  },
];

function formatTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

function getIcon(type) {
  switch (type) {
    case "fault":
      return "⚠️";
    case "alert":
      return "🔔";
    case "update":
      return "✏️";
    case "import":
      return "📤";
    case "resolved":
      return "✓";
    default:
      return "•";
  }
}

export default function ActivityLog({ onClose }) {
  return (
    <div className="activity-log">
      <div className="activity-log__header">
        <h2>Activity Log</h2>
        <button className="activity-log__close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="activity-log__list">
        {SAMPLE_ACTIVITIES.map((activity) => (
          <div key={activity.id} className={`activity-item activity-item--${activity.severity}`}>
            <div className="activity-item__icon">{getIcon(activity.type)}</div>
            <div className="activity-item__content">
              <div className="activity-item__title">{activity.title}</div>
              <div className="activity-item__description">{activity.description}</div>
              <div className="activity-item__time">{formatTime(activity.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="activity-log__footer">
        <button className="activity-log__view-all">View all activity</button>
      </div>
    </div>
  );
}
