import { useState, useEffect } from "react";
import Search from "./Search";
import TrackDetails from "./TrackDetails";
import WebPlayback from "./WebPlayback";
import "./Artists.css";

export default function Tracks() {
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [token, setToken] = useState<string>("");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function getToken() {
      try {
        const response = await fetch(`${API_URL}/token`, { credentials: "include" });
        const json = await response.json();
        setToken(json.access_token);
      } catch (e) {
        console.error("Error fetching token", e);
      }
    }
    getToken();
  }, []);

  const handleTrackSelect = (track: any) => {
    setSelectedTrack(track);
  };

  return (
    <div className="app-content artists-container">
      <div className="artists-search-section">
        <h1 className="section-title">Tracks</h1>
        <Search onTrackSelect={handleTrackSelect} type="track" />
      </div>

      <div className="artists-content">
        {selectedTrack ? (
          <TrackDetails trackId={selectedTrack.id} />
        ) : (
          <div className="empty-state">
            <p>Search for a song in your history to view stats.</p>
          </div>
        )}
      </div>

      {token && selectedTrack && (
        <div className="persistent-player">
          <WebPlayback token={token} trackUri={selectedTrack.uri} />
        </div>
      )}
    </div>
  );
}
