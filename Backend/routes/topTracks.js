import express from 'express';
import pool from '../db.js';
import axios from "axios";
const router = express.Router();



router.get('/', async (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
        return res.status(401).send('Unauthorized: No access token');
    }
    const time_range = req.query.time_range || 'long_term';
    try {
        const topTracksRes = await axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=10`, {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        res.json(topTracksRes.data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

export default router;
