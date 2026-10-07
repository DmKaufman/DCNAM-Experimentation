import { useMemo, useState } from "react";

const TYPE_LABEL = { rack: "Rack", pdu: "PDU", crac: "CRAC", building: "Building", hall: "Hall" };
const MAX_PLACE_RESULTS = 5;
const MAX_ENTITY_RESULTS = 5;

// "Ask Otto anything" is the promise on the placeholder — but the index is
// only racks/PDUs/CRACs, so a query like "compare racks" or "capacity"
// matched nothing and just showed the empty state. These are the other
// three pages behind the left rail, matched against the words a user would
// actually type for them, not just their exact page title.
const PAGE_COMMANDS = [
  { page: "home", label: "Go to Data Center Overview", keywords: ["home", "overview", "dashboard"] },
  { page: "capacity", label: "Go to Capacity Planning", keywords: ["capacity", "capacity planning", "power", "cooling", "rack space"] },
  { page: "compare", label: "Go to Compare Halls", keywords: ["compare", "compare halls", "compare racks"] },
];

function matchCommands(q) {
  return PAGE_COMMANDS.filter((cmd) => cmd.keywords.some((k) => q.includes(k) || k.includes(q)));
}

// Shown before the user has typed anything — a guided sample of the kinds
// of things this box can now actually answer (a page, a building/hall by
// name or location, or a specific piece of equipment), rather than leaving
// someone staring at a placeholder guessing what "anything" covers. Each
// one is a real query verified to resolve to real results, not a vague
// prompt that would just dead-end into the empty state.
const SUGGESTIONS = ["Compare halls", "Capacity planning", "Building 2", "Mumbai", "PDU-03"];

export default function OttoBar({ searchIndex, placeIndex, onSelectResult, onSelectHall, onNavigate }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const q = query.trim().toLowerCase();

  const commandResults = useMemo(() => (q ? matchCommands(q) : []), [q]);

  // Buildings/halls are places — matched against their own name and
  // location, not against rack/PDU/CRAC ids, so "mumbai" or "hall a" finds
  // the hall even though no equipment id contains that text.
  const placeResults = useMemo(() => {
    if (!q) return [];
    return placeIndex
      .filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.siteName.toLowerCase().includes(q) ||
          p.siteLocation.toLowerCase().includes(q)
      )
      .slice(0, MAX_PLACE_RESULTS);
  }, [q, placeIndex]);

  const entityResults = useMemo(() => {
    if (!q) return [];
    return searchIndex
      .filter((item) => item.id.includes(q) || item.label.toLowerCase().includes(q))
      .slice(0, MAX_ENTITY_RESULTS);
  }, [q, searchIndex]);

  const close = () => {
    setQuery("");
    setOpen(false);
  };

  const handleSelectEntity = (item) => {
    onSelectResult(item);
    close();
  };

  const handleSelectPlace = (place) => {
    onSelectHall(place.siteId, place.hallId);
    close();
  };

  const handleSelectCommand = (cmd) => {
    onNavigate(cmd.page);
    close();
  };

  const hasResults = commandResults.length > 0 || placeResults.length > 0 || entityResults.length > 0;

  return (
    <div className="otto-bar-wrap">
      <div className="otto-bar">
        <button className="otto-bar__chevron" aria-label="Collapse">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          className="otto-bar__input"
          placeholder="Ask Otto anything or search for a building, hall, rack, PDU, or CRAC"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button className="otto-bar__mic" aria-label="Voice input">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path
              d="M5 11a7 7 0 0 0 14 0M12 18v3"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {open && !query.trim() && (
        <>
          <div className="dropdown-overlay" onClick={() => setOpen(false)} />
          <div className="otto-suggestions">
            <span className="otto-suggestions__label">
              <SparkleIcon />
              Try asking Otto
            </span>
            <div className="otto-suggestions__chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="otto-suggestion-chip" onClick={() => setQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {open && query.trim() && (
        <>
          <div className="dropdown-overlay" onClick={() => setOpen(false)} />
          <ul className="otto-results">
            {!hasResults ? (
              <li className="otto-results__empty">
                No buildings, halls, racks, PDUs, CRACs, or pages match "{query}"
              </li>
            ) : (
              <>
                {commandResults.map((cmd) => (
                  <li key={cmd.page}>
                    <button className="otto-results__item" onClick={() => handleSelectCommand(cmd)}>
                      <span className="otto-results__type otto-results__type--command">Go to</span>
                      <span className="otto-results__label">{cmd.label}</span>
                    </button>
                  </li>
                ))}
                {placeResults.map((place) => (
                  <li key={place.id}>
                    <button className="otto-results__item" onClick={() => handleSelectPlace(place)}>
                      <span className="otto-results__type">{TYPE_LABEL[place.kind]}</span>
                      <span className="otto-results__label">{place.label}</span>
                      <span className="otto-results__location">{place.siteLocation}</span>
                    </button>
                  </li>
                ))}
                {entityResults.map((item) => (
                  <li key={`${item.siteId}-${item.hallId}-${item.id}`}>
                    <button className="otto-results__item" onClick={() => handleSelectEntity(item)}>
                      <span className="otto-results__type">{TYPE_LABEL[item.type]}</span>
                      <span className="otto-results__label">{item.label}</span>
                      <span className="otto-results__location">
                        {item.siteName} — {item.hallLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        </>
      )}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  );
}
