import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import cookieParser from 'cookie-parser';
import historyRouter from './routes/historyFile.js';
import spotifyRouter from './routes/spotify.js';
import topTracksRouter from './routes/topTracks.js';


dotenv.config();
const app = express();
app.use(
    cors({
        origin: "http://127.0.0.1:5173",
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

// Register both routers
app.use('/api/history', historyRouter);
app.use('/api/topTracks', topTracksRouter);
app.use('/api', spotifyRouter); // your Spotify endpoints: /api/login, /api/callback, /api/refresh

app.get('/', (req, res) => res.send('Backend running ✅'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
