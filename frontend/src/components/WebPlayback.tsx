import { useState, useEffect } from "react";

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
}

interface WebPlaybackProps {
    token: string;
    trackUri?: string;
}

export default function WebPlayback({ token, trackUri }: WebPlaybackProps) {
    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState<any>(undefined);
    const [current_track, setTrack] = useState(track);
    const [deviceId, setDeviceId] = useState<string>("");

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        // @ts-ignore
        window.onSpotifyWebPlaybackSDKReady = () => {
            // @ts-ignore
            const player = new window.Spotify.Player({
                name: 'SpotifyAPI Web Player',
                getOAuthToken: (cb: any) => { cb(token); },
                volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }: any) => {
                console.log('Ready with Device ID', device_id);
                setDeviceId(device_id);
            });

            player.addListener('not_ready', ({ device_id }: any) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('player_state_changed', (state: any) => {
                if (!state) {
                    return;
                }

                setTrack(state.track_window.current_track);
                setPaused(state.paused);

                player.getCurrentState().then((state: any) => { 
                    (!state) ? setActive(false) : setActive(true) 
                });
            });

            player.connect();
        };

        return () => {
            // Cleanup: pause and disconnect player when component unmounts
            if (player) {
                player.pause();
                player.disconnect();
            }
        };
    }, [token]);

    // Play track when trackUri changes
    useEffect(() => {
        if (!deviceId || !trackUri) return;

        const playTrack = async () => {
            try {
                await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                    method: "PUT",
                    body: JSON.stringify({ uris: [trackUri] }),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (e) {
                console.error("Error playing track", e);
            }
        };

        playTrack();
    }, [trackUri, deviceId, token]);

    // Pause player when component unmounts or when explicitly needed
    useEffect(() => {
        return () => {
            if (player) {
                player.pause();
            }
        };
    }, [player]);

    if (!is_active) { 
        return (
            <div className="web-player-container">
                <div className="player-message">
                    Instance ready. Select a track to start playback.
                </div>
            </div>
        )
    }

    return (
        <div className="web-player-container">
            <div className="main-wrapper">
                <img src={current_track.album.images[0].url} className="now-playing__cover" alt="" />

                <div className="now-playing__side">
                    <div className="now-playing__name">{current_track.name}</div>
                    <div className="now-playing__artist">{current_track.artists[0].name}</div>
                </div>

                <div className="player-controls">
                    <button className="btn-spotify" onClick={() => { player.previousTrack() }} >
                        &lt;&lt;
                    </button>

                    <button className="btn-spotify" onClick={() => { player.togglePlay() }} >
                        { is_paused ? "PLAY" : "PAUSE" }
                    </button>

                    <button className="btn-spotify" onClick={() => { player.nextTrack() }} >
                        &gt;&gt;
                    </button>
                </div>
            </div>
        </div>
    );
}
