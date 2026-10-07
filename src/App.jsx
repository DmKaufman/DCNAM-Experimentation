import { useEffect, useMemo, useState } from "react";
import LeftRail from "./components/LeftRail";
import TopBar from "./components/TopBar";
import HomePage from "./components/HomePage";
import CapacityPage from "./components/CapacityPage";
import ComparePage from "./components/ComparePage";
import ViewerCard from "./components/ViewerCard";
import TaskPanel from "./components/TaskPanel";
import ActivityPanel from "./components/ActivityPanel";
import OttoBar from "./components/OttoBar";
import { SITES, buildSearchIndex, buildPlaceIndex, buildHallOverviews } from "./scene/data";
import "./App.css";
import "./shell.css";
import "./darkMode.css";

export default function App() {
  const [page, setPage] = useState("home"); // "home" | "viewer" | "capacity" | "compare"

  const [siteId, setSiteId] = useState(SITES[0].id);
  const currentSite = useMemo(() => SITES.find((s) => s.id === siteId) ?? SITES[0], [siteId]);

  const [hallId, setHallId] = useState(currentSite.halls[0].id);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("dc-viewer-dark-mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("dc-viewer-dark-mode", String(darkMode));
    } catch {
      // ignore — private browsing / blocked storage
    }
  }, [darkMode]);

  const handleSelectSite = (newSiteId) => {
    setSiteId(newSiteId);
    const newSite = SITES.find((s) => s.id === newSiteId);
    setHallId(newSite.halls[0].id);
  };

  // From the homepage or capacity page: jump straight into a specific hall
  // in a specific building, then switch to the viewer page to show it.
  const handleSelectHall = (targetSiteId, targetHallId) => {
    setSiteId(targetSiteId);
    setHallId(targetHallId);
    setPage("viewer");
  };

  // A one-shot "please locate this kind of thing" request from the task or
  // activity panels — e.g. { type: "rack", rule: "firstFault" }. ViewerCard
  // resolves it against whatever hall is actually on screen (it already
  // owns that layout) and clears it once handled, rather than this
  // component needing to know anything about rack/PDU/CRAC data itself.
  const [pendingLocate, setPendingLocate] = useState(null);

  // Flattened once up front — cheap (no ports/positions, just id/label
  // derivation) so it's safe to build for the whole fleet regardless of
  // how many halls that ends up being.
  const searchIndex = useMemo(buildSearchIndex, []);
  const placeIndex = useMemo(buildPlaceIndex, []);

  // Built once here and handed down to Home, Capacity, and Compare instead
  // of each of them calling generateLayout() per hall independently — that
  // used to mean the same fleet-wide computation ran again every time you
  // switched between those pages.
  const hallOverviews = useMemo(buildHallOverviews, []);

  // A global search result already names the exact hall and exact item —
  // jump straight there the same way a task's "Locate in 3D model" does.
  const handleSearchSelect = (item) => {
    setSiteId(item.siteId);
    setHallId(item.hallId);
    setPage("viewer");
    setPendingLocate({ type: item.type, id: item.id });
  };

  return (
    <div className="app-shell" data-theme={darkMode ? "dark" : "light"}>
      <LeftRail
        onGoHome={() => setPage("home")}
        homeActive={page === "home"}
        onGoCapacity={() => setPage("capacity")}
        capacityActive={page === "capacity"}
        onGoCompare={() => setPage("compare")}
        compareActive={page === "compare"}
      />

      <div className="app-main">
        <TopBar
          sites={SITES}
          currentSite={currentSite}
          onSelectSite={handleSelectSite}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          page={page}
        />

        {page === "home" ? (
          <HomePage onSelectHall={handleSelectHall} overviews={hallOverviews} />
        ) : page === "capacity" ? (
          <CapacityPage onSelectHall={handleSelectHall} overviews={hallOverviews} />
        ) : page === "compare" ? (
          <ComparePage onSelectHall={handleSelectHall} overviews={hallOverviews} />
        ) : (
          <div className="app-body">
            <div className="app-body__left">
              <ViewerCard
                site={currentSite}
                hallId={hallId}
                onSelectHall={setHallId}
                darkMode={darkMode}
                pendingLocate={pendingLocate}
                onLocateHandled={() => setPendingLocate(null)}
              />
            </div>

            <div className="app-body__right">
              <TaskPanel onLocate={setPendingLocate} />
              <ActivityPanel onLocate={setPendingLocate} />
            </div>
          </div>
        )}

        <OttoBar
          searchIndex={searchIndex}
          placeIndex={placeIndex}
          onSelectResult={handleSearchSelect}
          onSelectHall={handleSelectHall}
          onNavigate={setPage}
        />
      </div>
    </div>
  );
}
