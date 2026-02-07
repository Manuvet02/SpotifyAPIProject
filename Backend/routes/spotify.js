import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import pool from "../db.js";

dotenv.config();

const router = express.Router();
router.use(express.json());

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, REDIRECT_URI, FRONTEND_URI } =
    process.env;

/* ------------------ LOGIN ------------------ */
router.get("/login", (req, res) => {
    const scope = "user-read-currently-playing user-read-playback-state user-modify-playback-state user-read-private user-read-email user-top-read streaming playlist-read-private playlist-read-collaborative";
    const redirect = new URL("https://accounts.spotify.com/authorize");
    redirect.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
    redirect.searchParams.set("response_type", "code");
    redirect.searchParams.set("redirect_uri", REDIRECT_URI);
    redirect.searchParams.set("scope", scope);

    res.redirect(redirect.toString());
});

/* ------------------ CALLBACK ------------------ */
router.get("/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing code parameter");

    try {
        const tokenRes = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: REDIRECT_URI,
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: SPOTIFY_CLIENT_SECRET,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token, refresh_token } = tokenRes.data;

        // ✅ Store tokens as HTTP-only cookies
        res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 3600 * 1000, // 1 hour
        });

        res.cookie("refresh_token", refresh_token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 30 * 24 * 3600 * 1000, // 30 days
        });

        // Redirect user to frontend cleanly (no tokens in URL)
        res.redirect(`${FRONTEND_URI}`);
    } catch (err) {
        console.error("Error in /callback:", err.response?.data || err.message);
        res.status(500).send("Token exchange failed");
    }
});

/* ------------------ REFRESH TOKEN ------------------ */
router.get("/refresh", async (req, res) => {
    const refresh_token = req.cookies.refresh_token;
    if (!refresh_token) return res.status(401).json({ error: "No refresh token" });

    try {
        const tokenRes = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token,
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: SPOTIFY_CLIENT_SECRET,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token } = tokenRes.data;

        // Update the access token cookie
        res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 3600 * 1000,
        });

        res.json({ ok: true });
    } catch (err) {
        console.error("Error in /refresh:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to refresh token" });
    }
});

/* ------------------ GET USER PROFILE ------------------ */
router.get("/me", async (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "Not logged in" });

    try {
        const spotifyRes = await axios.get("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        res.json(spotifyRes.data);
    } catch (err) {
        console.error("Error fetching profile:", err.response?.data || err.message);
        res.status(401).json({ error: "Access token invalid" });
    }
});

/* ------------------ SEARCH ARTIST (DB ONLY) ------------------ */
router.get("/search", async (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "Not logged in" });

    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Missing query parameter" });

    try {
        // 1. Search in local DB history
        const dbRes = await pool.query(
            `SELECT albumartist, COUNT(*) as play_count 
             FROM history 
             WHERE albumartist ILIKE $1 
             GROUP BY albumartist 
             ORDER BY play_count DESC 
             LIMIT 5`,
            [`%${q}%`]
        );

        const dbArtists = dbRes.rows;
        let finalResults = [];

        if (dbArtists.length > 0) {
            // Fetch metadata for DB artists
            const promises = dbArtists.map(async (dbArtist) => {
                try {
                    const searchRes = await axios.get(`https://api.spotify.com/v1/search`, {
                        headers: { Authorization: `Bearer ${access_token}` },
                        params: { q: dbArtist.albumartist, type: "artist", limit: 1 }
                    });
                    const artist = searchRes.data.artists.items[0];
                    if (artist) {
                        return { ...artist, user_play_count: parseInt(dbArtist.play_count) };
                    }
                } catch (e) {
                    console.error(`Failed to fetch metadata for ${dbArtist.albumartist}`);
                }
                return null;
            });

            const resolved = await Promise.all(promises);
            finalResults = resolved.filter(a => a !== null);
        }
        
        // NO FALLBACK to Spotify global search.
        // If finalResults is empty, we return empty array.

        res.json(finalResults);
    } catch (err) {
        console.error("Error searching artist:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to search artist" });
    }
});

/* ------------------ SEARCH TRACKS (DB ONLY) ------------------ */
router.get("/search/tracks", async (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "Not logged in" });

    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Missing query parameter" });

    console.log(`Searching tracks for query: ${q}`);
    try {
        // 1. Search in local DB history
        const dbRes = await pool.query(
            `SELECT trackname, albumartist, COUNT(*) as play_count 
             FROM history 
             WHERE trackname ILIKE $1 
             GROUP BY trackname, albumartist 
             ORDER BY play_count DESC 
             LIMIT 5`,
            [`%${q}%`]
        );

        const dbTracks = dbRes.rows;
        console.log(`Found ${dbTracks.length} tracks in DB`);
        let finalResults = [];

        if (dbTracks.length > 0) {
            // Fetch metadata for DB tracks
            const promises = dbTracks.map(async (dbTrack) => {
                try {
                    const searchRes = await axios.get(`https://api.spotify.com/v1/search`, {
                        headers: { Authorization: `Bearer ${access_token}` },
                        params: { q: `track:${dbTrack.trackname} artist:${dbTrack.albumartist}`, type: "track", limit: 1 }
                    });
                    const track = searchRes.data.tracks.items[0];
                    if (track) {
                        return { ...track, user_play_count: parseInt(dbTrack.play_count) };
                    }
                } catch (e) {
                    console.error(`Failed to fetch metadata for ${dbTrack.trackname}`);
                }
                return null;
            });

            const resolved = await Promise.all(promises);
            finalResults = resolved.filter(t => t !== null);
        }

        console.log(`Returning ${finalResults.length} tracks`);
        res.json(finalResults);
    } catch (err) {
        console.error("Error searching tracks:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to search tracks" });
    }
});

/* ------------------ GET TRACK DETAILS (DB + API) ------------------ */
router.get("/track/:id", async (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "Not logged in" });

    const { id } = req.params;

    try {
        console.log(`Fetching details for track ID: ${id}`);
        
        // 1. Fetch basic track info from Spotify
        console.log("Calling Spotify API: /tracks/" + id);
        const trackRes = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const track = trackRes.data;
        console.log("Track info fetched successfully");

        // 2. Audio Features (Deprecated/Restricted)
        const audioFeatures = null;

        // 3. Fetch User Stats from DB
        const statsRes = await pool.query(
             `SELECT COUNT(*) as play_count, SUM(ms_played) as total_ms 
              FROM history 
              WHERE trackname ILIKE $1 AND albumartist ILIKE $2`,
             [track.name, track.artists[0].name]
        );
        const stats = statsRes.rows[0];

        res.json({
            info: track,
            audioFeatures: audioFeatures,
            userStats: {
                playCount: parseInt(stats.play_count || 0),
                totalMs: parseInt(stats.total_ms || 0),
            }
        });
    } catch (err) {
        console.error("Error fetching track details:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to fetch track details" });
    }
});

/* ------------------ GET ARTIST DETAILS (DB + API) ------------------ */
router.get("/artist/:id", async (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "Not logged in" });

    const { id } = req.params;

    try {
        // 1. Fetch basic artist info from Spotify to get the name
        const artistRes = await axios.get(`https://api.spotify.com/v1/artists/${id}`, {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const artistName = artistRes.data.name;

        // 2. Fetch User Stats from DB using the artist name
        // Get total stats
        const artistStatsRes = await pool.query(
             `SELECT COUNT(*) as play_count, SUM(ms_played) as total_ms 
              FROM history 
              WHERE albumartist ILIKE $1`,
             [artistName]
        );
        const artistStats = artistStatsRes.rows[0];

        // Get top tracks from DB
        const topTracksDBRes = await pool.query(
            `SELECT trackname, COUNT(*) as track_play_count
             FROM history 
             WHERE albumartist ILIKE $1
             GROUP BY trackname
             ORDER BY track_play_count DESC
             LIMIT 5`,
            [artistName]
        );
        
        const topTracksDB = topTracksDBRes.rows.map(row => ({
            name: row.trackname,
            play_count: row.track_play_count
        }));

        // 3. Fetch Spotify Top Tracks and Albums
        const [topTracksRes, albumsRes] = await Promise.all([
            axios.get(`https://api.spotify.com/v1/artists/${id}/top-tracks`, {
                headers: { Authorization: `Bearer ${access_token}` },
                params: { market: "IT" }
            }),
            axios.get(`https://api.spotify.com/v1/artists/${id}/albums`, {
                headers: { Authorization: `Bearer ${access_token}` },
                params: { include_groups: "album,single", limit: 10, market: "IT" }
            })
        ]);

        res.json({
            info: artistRes.data,
            userStats: {
                playCount: parseInt(artistStats.play_count || 0),
                totalMs: parseInt(artistStats.total_ms || 0),
                topTracks: topTracksDB
            },
            topTracks: topTracksRes.data.tracks,
            albums: albumsRes.data.items
        });
    } catch (err) {
        console.error("Error fetching artist details:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to fetch artist details" });
    }
});

/* ------------------ SONG QUIZ QUESTION ------------------ */
router.get("/quiz/question", async (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "Not logged in" });

    try {
        // 1. Fetch 4 random distinct tracks from DB that have been played at least 2 times
        const dbRes = await pool.query(
            `SELECT trackname, albumartist 
             FROM history 
             GROUP BY trackname, albumartist 
             HAVING COUNT(*) > 1
             ORDER BY RANDOM() 
             LIMIT 4`
        );

        if (dbRes.rows.length < 4) {
            return res.status(400).json({ error: "Not enough songs in history (need at least 4 with >1 plays)" });
        }

        const dbTracks = dbRes.rows;
        
        // 2. Fetch metadata for all 4
        const promises = dbTracks.map(async (track) => {
            try {
                const searchRes = await axios.get(`https://api.spotify.com/v1/search`, {
                    headers: { Authorization: `Bearer ${access_token}` },
                    params: { q: `track:${track.trackname} artist:${track.albumartist}`, type: "track", limit: 1 }
                });
                return searchRes.data.tracks.items[0] || null;
            } catch (e) {
                console.error(`Failed to fetch quiz metadata for ${track.trackname}`);
                return null;
            }
        });

        const resolved = await Promise.all(promises);
        const options = resolved.filter(t => t !== null);

        if (options.length < 4) {
            return res.status(500).json({ error: "Failed to generate valid quiz options" });
        }

        // 3. Pick one as correct
        const correctIndex = Math.floor(Math.random() * options.length);
        const correctTrack = options[correctIndex];

        res.json({
            correctId: correctTrack.id,
            options: options
        });

    } catch (err) {
        console.error("Error generating quiz:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to generate quiz" });
    }
});

/* ------------------ GET USER PLAYLISTS ------------------ */
router.get("/playlists", async (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "Not logged in" });

    try {
        const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
            headers: { Authorization: `Bearer ${access_token}` },
            params: { limit: 50 }
        });
        res.json(response.data.items);
    } catch (err) {
        console.error("Error fetching playlists:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to fetch playlists" });
    }
});

/* ------------------ TOURNAMENT SEEDS ------------------ */
router.get("/tournament/seeds", async (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "Not logged in" });

    const size = parseInt(req.query.size) || 16;
    const playlistId = req.query.playlistId;

    if (![16, 32, 64, 128].includes(size)) {
        return res.status(400).json({ error: "Invalid size. Must be 16, 32, 64, or 128." });
    }

    console.log(`Fetching tournament seeds. Size: ${size}, Playlist: ${playlistId || "History"}`);

    try {
        let candidates = [];

        if (playlistId) {
            // Fetch tracks from specific playlist
            let allTracks = [];
            let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
            
            // Fetch first page (usually enough for most users, but we could paginate if needed)
            const playlistRes = await axios.get(url, {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            
            allTracks = playlistRes.data.items
                .map(item => item.track)
                .filter(t => t && t.id); // Allow tracks without preview_url
            
            if (allTracks.length < size) {
                 return res.status(400).json({ error: `Playlist has only ${allTracks.length} valid tracks. Need at least ${size}.` });
            }

            // Shuffle and pick 'size' candidates
            for (let i = allTracks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
            }
            
            candidates = allTracks.slice(0, size);
            return res.json(candidates);

        } else {
            // Fetch random tracks from DB (History)
            const dbRes = await pool.query(
                `SELECT trackname, albumartist, COUNT(*) as play_count 
                 FROM history 
                 GROUP BY trackname, albumartist 
                 HAVING COUNT(*) > 1
                 ORDER BY RANDOM() 
                 LIMIT $1`,
                [size + 10] // Fetch extra candidates
            );

            const dbTracks = dbRes.rows;
            console.log("Fetched tracks from DB:", dbTracks.length);

            // Helper function to process in batches
            const processBatch = async (items, batchSize, processItem) => {
                let results = [];
                for (let i = 0; i < items.length; i += batchSize) {
                    const batch = items.slice(i, i + batchSize);
                    const batchResults = await Promise.all(batch.map(processItem));
                    results = results.concat(batchResults);
                    if (i + batchSize < items.length) {
                        await new Promise(resolve => setTimeout(resolve, 200)); 
                    }
                }
                return results;
            };

            const resolved = await processBatch(dbTracks, 5, async (track) => {
                try {
                    await new Promise(r => setTimeout(r, Math.random() * 50));
                    const searchRes = await axios.get(`https://api.spotify.com/v1/search`, {
                        headers: { Authorization: `Bearer ${access_token}` },
                        params: { q: `track:${track.trackname} artist:${track.albumartist}`, type: "track", limit: 1 }
                    });
                    const spotifyTrack = searchRes.data.tracks.items[0];
                    if (spotifyTrack) {
                        return spotifyTrack;
                    }
                } catch (e) {
                    console.error(`Failed to fetch metadata for ${track.trackname}`);
                }
                return null;
            });

            candidates = resolved.filter(t => t !== null);
        }

        console.log(`Fetched ${candidates.length} valid seeds`);
        
        if (candidates.length < size) {
            return res.status(500).json({ error: `Not enough valid songs found. Found ${candidates.length}, needed ${size}. Try again.` });
        }

        // Trim to exact size
        candidates = candidates.slice(0, size);

        // Shuffle again just in case
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        res.json(candidates);
    } catch (err) {
        console.error("Error fetching tournament seeds:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to fetch tournament seeds" });
    }
});

/* ------------------ GET TOKEN (FOR SDK) ------------------ */
router.get("/token", (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "Not logged in" });
    res.json({ access_token });
});

/* ------------------ LOGOUT ------------------ */
router.post("/logout", (req, res) => {
    res.clearCookie("access_token", { sameSite: "none", secure: true });
    res.clearCookie("refresh_token", { sameSite: "none", secure: true });
    res.json({ ok: true });
});

export default router;