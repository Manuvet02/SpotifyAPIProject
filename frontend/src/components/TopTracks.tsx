import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import SpotifyEmbed from "./playback";

export default function TopTracks() {
  const ctx = useContext(AuthContext);
  if (!ctx) return null;
  const { topTrack } = ctx;
  return (
    <>
      {topTrack?.items?.map((track: any) => (
        <SpotifyEmbed key={track.id} uri={track.uri} />
      ))}
    </>
  );
}
