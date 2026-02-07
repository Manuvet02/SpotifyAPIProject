import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Search.css";

interface SearchProps {
  onArtistSelect?: (artistId: string) => void;
  onTrackSelect?: (track: any) => void;
  type?: "artist" | "track";
}

export default function Search({ onArtistSelect, onTrackSelect, type = "artist" }: SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const endpoint = type === "track" ? "/search/tracks" : "/search";
      const res = await fetch(`${API_URL}${endpoint}?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder={type === "track" ? "Search for a song..." : "Search for an artist..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">
          Search
        </button>
      </form>

      {loading && <div className="loading">Searching...</div>}

      {results.length > 0 && <div className="search-results">
        {results.map((item) => (
            <div
              key={item.id}
              className="search-result-item"
              onClick={() => {
                if (type === "artist" && onArtistSelect) {
                    onArtistSelect(item.id);
                } else if (type === "track" && onTrackSelect) {
                    onTrackSelect(item);
                }
                setQuery(""); 
                setResults([]);
              }}
            >
              <img
                src={
                    type === "track" 
                        ? (item.album?.images?.[2]?.url || item.album?.images?.[0]?.url || "https://via.placeholder.com/50")
                        : (item.images?.[2]?.url || item.images?.[0]?.url || "https://via.placeholder.com/50")
                }
                alt={item.name}
                className={`search-result-image ${type === "artist" ? "is-artist" : ""}`}
              />
              <div className="search-result-info">
                <span className="search-result-name">{item.name}</span>
                {type === "track" && <span className="search-result-subtitle">{item.artists?.[0]?.name}</span>}
                <span className="search-result-plays">
                  {item.user_play_count} plays
                </span>
              </div>
            </div>
          ))}
      </div>}
    </div>
  );
}
