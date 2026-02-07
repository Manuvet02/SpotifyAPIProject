/**
 * Props:
 * - uri: full Spotify URI (e.g. "spotify:track:4uLU6hMCjMI75M1A2tKUQC")
 * - height: optional custom height
 */
import React from "react";

interface Props {
  uri?: string;
  height?: number;
}

const SpotifyEmbed: React.FC<Props> = ({ uri, height = 152 }) => {
  if (!uri) return null;

  // Example URI formats:
  // spotify:track:4uLU6hMCjMI75M1A2tKUQC
  // spotify:album:6JWc4iAiJ9FjyK0B59ABb4
  // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M

  const parts = uri.split(":");
  if (parts.length < 3) return <p>Invalid Spotify URI</p>;

  const [, type, id] = parts;
  const src = `https://open.spotify.com/embed/${type}/${id}?utm_source=oembed`;

  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="eager"
      style={{
        borderRadius: "12px",
        justifyContent: "left",
        border: "none",
        display: "flex",
        margin: "0 auto",
      }}
    ></iframe>
  );
};

export default SpotifyEmbed;
