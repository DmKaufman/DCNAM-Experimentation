const ICONS = [
  { key: "calendar", path: "M3 9h18M7 3v4M17 3v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" },
  { key: "inbox", path: "M4 12h4l2 3h4l2-3h4M4 12l1.5-7h13L20 12M4 12v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" },
  { key: "building", path: "M4 21V7l8-4 8 4v14M4 21h16M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1" },
  { key: "shield", path: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" },
  { key: "tree", path: "M12 3v5M6 14h12M6 14l-2 7M6 14l2-4M18 14l2 7M18 14l-2-4M12 8a3 3 0 1 0 0-.01" },
];

export default function LeftRail({
  onGoHome,
  homeActive,
  onGoCapacity,
  capacityActive,
  onGoCompare,
  compareActive,
}) {
  return (
    <nav className="left-rail">
      <div className="left-rail__logo" title="Home">
        <span className="left-rail__logo-mark" />
      </div>

      <button
        className={`left-rail__item${homeActive ? " left-rail__item--active" : ""}`}
        title="Home"
        aria-label="Home"
        onClick={onGoHome}
      >
        <HomeIcon />
      </button>

      <button
        className={`left-rail__item${capacityActive ? " left-rail__item--active" : ""}`}
        title="Capacity Planning"
        aria-label="Capacity Planning"
        onClick={onGoCapacity}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 12h4l2 7 4-14 2 7h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        className={`left-rail__item${compareActive ? " left-rail__item--active" : ""}`}
        title="Compare Halls"
        aria-label="Compare Halls"
        onClick={onGoCompare}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M12 4v16" strokeLinecap="round" />
        </svg>
      </button>

      {ICONS.map((icon) => (
        <button key={icon.key} className="left-rail__item" title={icon.key} aria-label={icon.key}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={icon.path} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}

      <div className="left-rail__spacer" />

      <button className="left-rail__item" title="Settings" aria-label="Settings">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 13a7.9 7.9 0 0 0 0-2l2-1.5-2-3.4-2.4.6a8 8 0 0 0-1.7-1L15 3h-6l-.3 2.7a8 8 0 0 0-1.7 1l-2.4-.6-2 3.4L4.6 11a7.9 7.9 0 0 0 0 2l-2 1.5 2 3.4 2.4-.6a8 8 0 0 0 1.7 1L9 21h6l.3-2.7a8 8 0 0 0 1.7-1l2.4.6 2-3.4z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="left-rail__avatar" title="Daniel Kaufman">DK</div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11l9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
