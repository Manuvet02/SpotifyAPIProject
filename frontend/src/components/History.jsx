import { useState, useEffect } from "react";
// @ts-ignore
import TreeMap from "./TreeMap.jsx";
// @ts-ignore
import Calendar from "./Calendar.jsx";
import SpotifyEmbed from "./playback";

export default function History() {
  const [treeMapData, setTreeMapData] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [topTrack, setTopTrack] = useState(null);
  const [timeRange, setTimeRange] = useState('long_term');
  const API_URL = import.meta.env.VITE_API_URL;

  // Reload top tracks when timeRange changes
  useEffect(() => {
      if (topTrack) {
          loadTopTracks();
      }
  }, [timeRange]);

  const loadTopTracks = async () => {
    // Clear other data
    setTreeMapData(null);
    setCalendarData(null);
    
    const res = await fetch(`${API_URL}/topTracks?time_range=${timeRange}`, {
      credentials: "include",
    });
    setTopTrack(await res.json());
  };

  const loadTreeMap = async () => {
    // Clear other data
    setTopTrack(null);
    setCalendarData(null);
    
    const res = await fetch(`${API_URL}/history/treemap`, {
      credentials: "include",
    });
    setTreeMapData(await res.json());
  };

  const loadCalendar = async () => {
    // Clear other data
    setTopTrack(null);
    setTreeMapData(null);
    
    const res = await fetch(`${API_URL}/history/calendar`, {
      credentials: "include",
    });
    setCalendarData(await res.json());
  };

  return (
    <div className="app-content">
      <div className="history-container">
        <div className="section-header" style={{ justifyContent: "center", width: "100%" }}>
          <h1 className="section-title" style={{ fontSize: "2.5rem" }}>Listening History</h1>
        </div>

        <div className="history-buttons">
          <button onClick={loadTopTracks}>Load Top Tracks</button>
          <button onClick={loadTreeMap}>Load Tree Map</button>
          <button onClick={loadCalendar}>Load Calendar</button>
        </div>

        {/* Time Range Selector for Top Tracks */}
        {topTrack && (
            <div className="time-range-selector" style={{ marginTop: "1rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
                <button 
                    className={timeRange === 'short_term' ? 'active' : ''} 
                    onClick={() => setTimeRange('short_term')}
                    style={{ opacity: timeRange === 'short_term' ? 1 : 0.6 }}
                >
                    Last 4 Weeks
                </button>
                <button 
                    className={timeRange === 'medium_term' ? 'active' : ''} 
                    onClick={() => setTimeRange('medium_term')}
                    style={{ opacity: timeRange === 'medium_term' ? 1 : 0.6 }}
                >
                    Last 6 Months
                </button>
                <button 
                    className={timeRange === 'long_term' ? 'active' : ''} 
                    onClick={() => setTimeRange('long_term')}
                    style={{ opacity: timeRange === 'long_term' ? 1 : 0.6 }}
                >
                    All Time (1 Year)
                </button>
            </div>
        )}

      {treeMapData && (
        <div className="treemap-container">
          <TreeMap data={treeMapData} />
        </div>
      )}
      
      {calendarData && (
        <div className="treemap-container" style={{ height: "auto", minHeight: "300px" }}>
          <Calendar data={calendarData} />
        </div>
      )}

      {topTrack?.items && (
        <div style={{ marginTop: "2rem" }}>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>Top Tracks</h2>
          <div className="grid-container">
            {topTrack.items.map((t) => (
              <SpotifyEmbed key={t.id} uri={t.uri} />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
