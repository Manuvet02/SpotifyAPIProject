import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ArtistDetails.css";

interface Props {
  artistId?: string;
  onTrackSelect?: (uri: string) => void;
}

export default function ArtistDetails({ artistId, onTrackSelect }: Props) {
  const { id: paramId } = useParams();
  const id = artistId || paramId; // Use prop if available, otherwise param
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!id) return;
    
    const fetchArtist = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/artist/${id}`, {
          credentials: "include",
        });
        if (res.ok) {
          const artistData = await res.json();
          setData(artistData);
        }
      } catch (err) {
        console.error("Failed to fetch artist", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  if (loading) {
    return <div className="loading-container">Loading artist...</div>;
  }

  if (!data) {
    return <div>Artist not found</div>;
  }

  const { info, topTracks, albums } = data;

  return (
    <div className="artist-details-container">
      <div className="artist-header">
        <img
          src={info.images[0]?.url || "https://via.placeholder.com/300"}
          alt={info.name}
          className="artist-image"
        />
        <div className="artist-info">
          <h1 className="artist-name">{info.name}</h1>
          <div className="artist-stats">
            <span className="stat">
              {info.followers.total.toLocaleString()} followers
            </span>
            <span className="stat">Popularity: {info.popularity}/100</span>
          </div>
          {info.genres && info.genres.length > 0 && (
            <div className="artist-genres">
              {info.genres.map((genre: string) => (
                <span key={genre} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}
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

      {data.userStats && data.userStats.playCount > 0 && (
        <section className="artist-section user-stats-section">
          <h2 className="section-title">Your Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{data.userStats.playCount}</span>
              <span className="stat-label">Total Streams</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {Math.round(data.userStats.totalMs / 1000 / 60 / 60)}
              </span>
              <span className="stat-label">Hours Listened</span>
            </div>
          </div>
          
          {data.userStats.topTracks.length > 0 && (
            <div className="user-top-tracks">
                <h3 className="subsection-title">Your Top Songs</h3>
                <ul className="track-list">
                    {data.userStats.topTracks.map((track: any, index: number) => (
                        <li key={index} className="track-item">
                            <span className="track-rank">{index + 1}</span>
                            <span className="track-name">{track.name}</span>
                            <span className="track-plays">{track.play_count} plays</span>
                        </li>
                    ))}
                </ul>
            </div>
          )}
        </section>
      )}

      <section className="artist-section">
        <h2 className="section-title">Top Tracks</h2>
        <div className="tracks-list-container">
          <p className="hint-text">Double-click a song to play</p>
          <ul className="track-list">
            {topTracks.slice(0, 10).map((track: any, index: number) => (
                <li 
                    key={track.id} 
                    className="track-item playable-track"
                    onDoubleClick={() => onTrackSelect && onTrackSelect(track.uri)}
                >
                    <span className="track-rank">{index + 1}</span>
                    <img src={track.album.images[2]?.url} alt="" className="track-thumb" />
                    <div className="track-details">
                        <span className="track-name">{track.name}</span>
                        <span className="track-album">{track.album.name}</span>
                    </div>
                    <span className="track-duration">
                        {Math.floor(track.duration_ms / 60000)}:
                        {((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
                    </span>
                </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="artist-section">
        <h2 className="section-title">Albums & Singles</h2>
        <div className="albums-grid">
          {albums.map((album: any) => (
            <div key={album.id} className="album-card">
              <img
                src={album.images[0]?.url || "https://via.placeholder.com/150"}
                alt={album.name}
                className="album-image"
              />
              <div className="album-info">
                <span className="album-name">{album.name}</span>
                <span className="album-year">
                  {new Date(album.release_date).getFullYear()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
