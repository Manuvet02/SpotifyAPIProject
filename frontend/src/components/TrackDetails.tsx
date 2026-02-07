import { useEffect, useState } from "react";
import "./ArtistDetails.css"; // Reuse ArtistDetails CSS

interface Props {
  trackId: string;
}

export default function TrackDetails({ trackId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!trackId) return;
    
    const fetchTrack = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/track/${trackId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const trackData = await res.json();
          setData(trackData);
        }
      } catch (err) {
        console.error("Failed to fetch track", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
  }, [trackId]);

  if (loading) {
    return <div className="loading-container">Loading track...</div>;
  }

  if (!data) {
    return <div>Track not found</div>;
  }

  const { info, userStats, audioFeatures } = data;

  return (
    <div className="artist-details-container">
      <div className="artist-header">
        <img
          src={info.album.images[0]?.url || "https://via.placeholder.com/300"}
          alt={info.name}
          className="artist-image"
        />
        <div className="artist-info">
          <h1 className="artist-name">{info.name}</h1>
          <h2 className="artist-subtitle" style={{ fontSize: '1.5rem', color: 'var(--spotify-grey)', marginBottom: '1rem' }}>
            {info.artists.map((a: any) => a.name).join(", ")} • {info.album.name}
          </h2>
          
          <div className="artist-stats">
            <span className="stat">Popularity: {info.popularity}/100</span>
            <span className="stat">
                {new Date(info.album.release_date).getFullYear()}
            </span>
          </div>

          {info.external_urls?.spotify && (
            <a
              href={info.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="spotify-link"
            >
              Open on Spotify
            </a>
          )}
        </div>
      </div>

      {userStats && (
        <section className="artist-section user-stats-section">
          <h2 className="section-title">Your Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{userStats.playCount}</span>
              <span className="stat-label">Total Streams</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {Math.round(userStats.totalMs / 1000 / 60)}
              </span>
              <span className="stat-label">Minutes Listened</span>
            </div>
          </div>
        </section>
      )}

      {audioFeatures && (
        <section className="artist-section">
            <h2 className="section-title">Audio Features</h2>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <div className="stat-card">
                    <span className="stat-value">{Math.round(audioFeatures.danceability * 100)}%</span>
                    <span className="stat-label">Danceability</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{Math.round(audioFeatures.energy * 100)}%</span>
                    <span className="stat-label">Energy</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{Math.round(audioFeatures.valence * 100)}%</span>
                    <span className="stat-label">Mood (Valence)</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{Math.round(audioFeatures.tempo)}</span>
                    <span className="stat-label">BPM</span>
                </div>
            </div>
        </section>
      )}
    </div>
  );
}
