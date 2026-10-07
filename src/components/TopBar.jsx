import { useState } from "react";

export default function TopBar({ sites, currentSite, onSelectSite, darkMode, onToggleDarkMode, page = "viewer", onImport, onActivityToggle }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="top-bar">
      <div className="top-bar__crumbs">
        <span className="top-bar__crumb-muted">SOW</span>
        <span className="top-bar__chevron">›</span>
        <span className="top-bar__crumb-muted">···</span>
        {page === "home" || page === "capacity" || page === "compare" ? (
          <div className="top-bar__title-row">
            <div className="top-bar__title-btn top-bar__title-btn--static">
              <h1>
                {page === "home"
                  ? "Data Center Overview"
                  : page === "capacity"
                    ? "Capacity Planning"
                    : "Compare Halls"}
              </h1>
            </div>
          </div>
        ) : (
          <div className="top-bar__title-row">
            <button className="top-bar__title-btn" onClick={() => setOpen((o) => !o)}>
              <h1>
                {currentSite.name} at {currentSite.location}
              </h1>
              <PinIcon />
              <CaretIcon />
            </button>

            {open && (
              <>
                <div className="dropdown-overlay" onClick={() => setOpen(false)} />
                <div className="site-dropdown">
                  <div className="site-dropdown__label">Switch building</div>
                  {sites.map((site) => (
                    <button
                      key={site.id}
                      className={`site-dropdown__item${
                        site.id === currentSite.id ? " site-dropdown__item--active" : ""
                      }`}
                      onClick={() => {
                        onSelectSite(site.id);
                        setOpen(false);
                      }}
                    >
                      <span className="site-dropdown__name">{site.name}</span>
                      <span className="site-dropdown__location">{site.location}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="top-bar__actions">
        <button
          className="icon-btn"
          title="Activity log"
          aria-label="Activity log"
          onClick={onActivityToggle}
        >
          <PulseIcon />
        </button>
        <button
          className="icon-btn"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle dark mode"
          onClick={onToggleDarkMode}
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
        <span className="top-bar__divider" />
        {page === "home" && (
          <button className="top-bar__import-btn" onClick={onImport} title="Import data">
            <UploadIcon />
            Import Data
          </button>
        )}
        <button className="icon-btn" title="More" aria-label="More">
          <KebabIcon />
        </button>
        <div className="top-bar__updown">
          <button className="icon-btn icon-btn--small" title="Previous" aria-label="Previous">
            <ChevronUp />
          </button>
          <button className="icon-btn icon-btn--small" title="Next" aria-label="Next">
            <ChevronDown />
          </button>
        </div>
      </div>
    </header>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" strokeLinejoin="round" />
    </svg>
  );
}

function CaretIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M8 12l6.5-6.5a3 3 0 1 1 4.24 4.24L11 17.5a5 5 0 1 1-7.07-7.07L12.5 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h4l2 7 4-14 2 7h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4.5" />
      <path
        d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        strokeLinecap="round"
      />
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

function ChevronUp() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
