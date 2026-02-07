import type { Track } from "../types/track";
import "./TopTrackObj.css";

type Props = {
  track: Track;
};

function msToTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TopTrackObj({ track }: Props) {
  if (!track) return null;

  const img =
    track.album?.images && track.album.images.length > 0
      ? track.album.images[0].url
      : undefined;
  const artists = track.artists?.map((a) => a.name).join(", ");

  return (
    <div className="top-track-card">
      <div className="top-track-art">
        {img ? (
          <img src={img} alt={`${track.name} album art`} />
        ) : (
          <div className="no-art">No art</div>
        )}
      </div>

      <div className="top-track-details">
        <div className="top-track-title" title={track.name}>
          {track.name}
        </div>
        <div className="top-track-artists" title={artists}>
          {artists}
        </div>
        <div className="top-track-meta">
          <span>{msToTime(track.duration_ms)}</span>
        </div>
      </div>

      <div className="top-track-links">
        {track.preview_url ? (
          <audio controls src={track.preview_url} style={{ height: "30px" }} />
        ) : (
          <a
            href={
              track.external_urls?.spotify ||
              track.album?.external_urls?.spotify
            }
            target="_blank"
            rel="noreferrer"
          >
            Play
          </a>
        )}
      </div>
    </div>
  );
}

export default TopTrackObj;
