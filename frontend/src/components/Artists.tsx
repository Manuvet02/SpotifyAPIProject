import { useState, useEffect } from "react";
import Search from "./Search";
import ArtistDetails from "./ArtistDetails";
import WebPlayback from "./WebPlayback";
import "./Artists.css";
import "./WebPlayback.css";

export default function Artists() {
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [currentTrackUri, setCurrentTrackUri] = useState<string | null>(null);
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

  const handleArtistSelect = (artistId: string) => {
    setSelectedArtistId(artistId);
  };

  const handleTrackSelect = (uri: string) => {
    setCurrentTrackUri(uri);
  };

  return (
    <div className="app-content artists-container">
      <div className="artists-search-section">
        <h1 className="section-title">Artists</h1>
        <Search onArtistSelect={handleArtistSelect} />
      </div>

      <div className="artists-content">
        {selectedArtistId ? (
          <ArtistDetails
            artistId={selectedArtistId}
            onTrackSelect={handleTrackSelect}
          />
        ) : (
          <div className="empty-state">
            <p>Search for an artist to view details and play music.</p>
          </div>
        )}
      </div>

      {token && (
        <div className="persistent-player">
          <WebPlayback token={token} trackUri={currentTrackUri || undefined} />
        </div>
      )}
    </div>
  );
}
