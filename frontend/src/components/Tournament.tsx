import { useState, useEffect } from "react";
import WebPlayback from "./WebPlayback";
import "./Tournament.css";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  uri: string;
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
}

export default function Tournament() {
  const [size, setSize] = useState<number | null>(null);
  const [seeds, setSeeds] = useState<Track[]>([]);
  const [currentRound, setCurrentRound] = useState<Track[]>([]);
  const [nextRound, setNextRound] = useState<Track[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [winner, setWinner] = useState<Track | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  
  // Playlist Selection State
  const [source, setSource] = useState<"history" | "playlist">("history");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

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
  }, [API_URL]);

  // Fetch playlists when source changes to playlist
  useEffect(() => {
    if (source === "playlist" && playlists.length === 0) {
      async function fetchPlaylists() {
        setLoadingPlaylists(true);
        try {
          const res = await fetch(`${API_URL}/playlists`, { credentials: "include" });
          if (!res.ok) throw new Error("Failed to fetch playlists");
          const data = await res.json();
          setPlaylists(data);
        } catch (e) {
          console.error("Error fetching playlists", e);
          setError("Could not load your playlists.");
        } finally {
          setLoadingPlaylists(false);
        }
      }
      fetchPlaylists();
    }
  }, [source, API_URL, playlists.length]);

  const handlePlay = (e: React.MouseEvent, uri: string) => {
    e.stopPropagation(); // Prevent voting when clicking play
    setPlayingUri(uri);
  };

  const [roundsHistory, setRoundsHistory] = useState<Track[][]>([]);

  const startTournament = async (selectedSize: number) => {
    if (source === "playlist" && !selectedPlaylistId) {
      setError("Please select a playlist first.");
      return;
    }

    setSize(selectedSize);
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching tournament seeds for size ${selectedSize}...`);
      
      let url = `${API_URL}/tournament/seeds?size=${selectedSize}`;
      if (source === "playlist" && selectedPlaylistId) {
        url += `&playlistId=${selectedPlaylistId}`;
      }

      const res = await fetch(url, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Backend error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Seeds received:", data);
      
      if (!Array.isArray(data) || data.length < 2) {
        throw new Error("Not enough songs found to start a tournament.");
      }

      setSeeds(data);
      setCurrentRound(data);
      setRoundsHistory([data]); // Start history with seeds
      setNextRound([]);
      setCurrentMatchIndex(0);
      setWinner(null);
    } catch (err: any) {
      console.error("Failed to start tournament", err);
      setError(err.message || "Failed to load tournament");
      setSize(null); // Reset to allow trying again
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (track: Track) => {
    // Stop any playing track when voting by calling Spotify API
    if (playingUri && token) {
      try {
        await fetch(`https://api.spotify.com/v1/me/player/pause`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        console.error("Error pausing playback", e);
      }
    }
    setPlayingUri(null);
    
    const updatedNextRound = [...nextRound, track];
    setNextRound(updatedNextRound);

    // Check if round is complete
    if (currentMatchIndex + 2 >= currentRound.length) {
      // Round complete
      const newHistory = [...roundsHistory, updatedNextRound];
      setRoundsHistory(newHistory);

      if (updatedNextRound.length === 1) {
        // Tournament complete!
        setWinner(updatedNextRound[0]);
      } else {
        // Prepare next round
        setCurrentRound(updatedNextRound);
        setNextRound([]);
        setCurrentMatchIndex(0);
      }
    } else {
      // Next match in current round
      setCurrentMatchIndex(currentMatchIndex + 2);
    }
  };

  if (!size) {
    return (
      <div className="app-content center-content">
        <h1 className="section-title">Music Tournament</h1>
        <p className="tournament-desc">Choose your source and bracket size to start the battle!</p>
        
        {/* Source Selection */}
        <div className="source-selection">
            <button 
                className={`source-btn ${source === "history" ? "active" : ""}`}
                onClick={() => { setSource("history"); setSelectedPlaylistId(null); setError(null); }}
            >
                My History
            </button>
            <button 
                className={`source-btn ${source === "playlist" ? "active" : ""}`}
                onClick={() => { setSource("playlist"); setError(null); }}
            >
                My Playlists
            </button>
        </div>

        {/* Playlist Dropdown */}
        {source === "playlist" && (
            <div className="playlist-selector">
                {loadingPlaylists ? (
                    <div className="loading-text">Loading playlists...</div>
                ) : (
                    <select 
                        className="playlist-dropdown"
                        value={selectedPlaylistId || ""}
                        onChange={(e) => setSelectedPlaylistId(e.target.value)}
                    >
                        <option value="" disabled>Select a playlist</option>
                        {playlists.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.tracks.total} songs)
                            </option>
                        ))}
                    </select>
                )}
            </div>
        )}

        {error && <div className="error-message" style={{color: 'red', marginBottom: '1rem'}}>{error}</div>}
        
        <div className="size-buttons">
          {[16, 32, 64 , 128].map((s) => (
            <button 
                key={s} 
                className="size-btn" 
                onClick={() => startTournament(s)}
                disabled={source === "playlist" && !selectedPlaylistId}
            >
              {s} Songs
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="app-content loading-container">Loading your songs...</div>;
  }

  if (winner) {
    return (
      <div className="app-content center-content winner-container">
        <h1 className="winner-title">🏆 The Winner 🏆</h1>
        <img src={winner.album.images[0].url} alt={winner.name} className="winner-image" />
        <h2 className="winner-name">{winner.name}</h2>
        <h3 className="winner-artist">{winner.artists[0].name}</h3>
        {token && (
            <div className="winner-player">
                 <WebPlayback token={token} trackUri={winner.uri} />
            </div>
        )}
        <button className="restart-btn" onClick={() => setSize(null)}>
          Start New Tournament
        </button>
        
        <div className="bracket-container">
            <h3 className="bracket-title">Tournament Bracket</h3>
            <div className="bracket-scroll">
                <div className="bracket-tree">
                    {roundsHistory.map((roundTracks, roundIndex) => (
                        <div key={roundIndex} className="bracket-round">
                            <h4 className="round-label">
                                {roundTracks.length === 1 ? "Winner" : `Round of ${roundTracks.length}`}
                            </h4>
                            <div className="round-matches">
                                {roundTracks.map((track, i) => (
                                    <div key={i} className={`bracket-item ${track.id === winner.id ? 'winner-path' : ''}`}>
                                        <img src={track.album.images[2]?.url || track.album.images[0].url} alt="" className="bracket-thumb" />
                                        <div className="bracket-info">
                                            <span className="bracket-name">{track.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
  }

  const track1 = currentRound[currentMatchIndex];
  const track2 = currentRound[currentMatchIndex + 1];

  if (!track1 || !track2) return <div>Error: Match not found</div>;

  return (
    <div className="app-content tournament-container">
      <div className="tournament-header">
        <h2 className="round-info">
          Round of {currentRound.length} • Match {Math.floor(currentMatchIndex / 2) + 1} / {currentRound.length / 2}
        </h2>
      </div>

      <div className="match-container">
        <div className="match-card" onClick={() => handleVote(track1)}>
          <img src={track1.album.images[0].url} alt={track1.name} className="match-image" />
          <div className="match-info">
            <h3 className="match-name">{track1.name}</h3>
            <p className="match-artist">{track1.artists[0].name}</p>
            <button className="card-play-btn" onClick={(e) => handlePlay(e, track1.uri)}>
              {playingUri === track1.uri ? "Playing..." : "Play Preview"}
            </button>
          </div>
          <div className="vote-overlay">VOTE</div>
        </div>

        <div className="vs-badge">VS</div>

        <div className="match-card" onClick={() => handleVote(track2)}>
          <img src={track2.album.images[0].url} alt={track2.name} className="match-image" />
          <div className="match-info">
            <h3 className="match-name">{track2.name}</h3>
            <p className="match-artist">{track2.artists[0].name}</p>
            <button className="card-play-btn" onClick={(e) => handlePlay(e, track2.uri)}>
              {playingUri === track2.uri ? "Playing..." : "Play Preview"}
            </button>
          </div>
          <div className="vote-overlay">VOTE</div>
        </div>
      </div>

      {/* Hidden player to handle playback logic */}
      {token && playingUri && (
        <div style={{ display: 'none' }}>
             <WebPlayback token={token} trackUri={playingUri} /> 
        </div>
      )}
    </div>
  );
}
