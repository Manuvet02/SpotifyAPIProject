import express from 'express';
import pool from '../db.js';
const router = express.Router();


//
// ✅ GET all history files
//
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('select trackname, albumartist , count(*) as play_count, spotifyuri from history group by trackname, albumartist , spotifyuri order by play_count desc');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

router.get('/treemap', async (req, res) => {
    try {
        const result = await pool.query('SELECT albumartist,albumname ,trackname, count(*) AS total_tracks, round ( count(*) *100 / sum(count(*)) OVER (PARTITION BY albumname),2) AS ratio_within_album FROM history group by albumartist, albumname,trackname having count(*) >=50 order by total_tracks desc');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

router.get('/calendar', async (req, res) => {
    try {
        const result = await pool.query('SELECT DATE(ts) AS day, COUNT(*) AS tracks_listened, SUM(ms_played) AS total_time FROM history GROUP BY day order by day');
        result.rows.forEach(row => {
            row.day = row.day.toISOString().split('T')[0];
        });
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});


//
// ✅ GET a single history file by ID
//
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM history WHERE historyid = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send('Not found');
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

//
// ✅ POST — create a new history file entry
//
/*
router.post('/', upload.single('zipfile'), async (req, res) => {
    try {
        const filePath = req.file.path;

        const directory = await unzipper.Open.file(filePath);
        const allEntries = [];

        // Loop through each file in the zip
        for (const entry of directory.files) {
            if (entry.path.endsWith('.json')) {
                const content = await entry.buffer();
                const jsonArray = JSON.parse(content.toString());

                // Flatten or adapt JSON structure
                for (const obj of jsonArray) {
                    const historyEntry = new HistoryFile(obj);
                    allEntries.push(historyEntry);
                }
            }
        }

        // ⚡ Efficient insert in chunks (to avoid overload)
        const BATCH_SIZE = 1000;
        for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
            const chunk = allEntries.slice(i, i + BATCH_SIZE);

            const values = chunk.map(h => [
                h.ts, h.platform, h.ms_played, h.conn_country, h.ipaddress,
                h.trackname, h.albumartist, h.albumname, h.spotifyuri,
                h.episodename, h.episodeshow, h.spotifyepisodeuri, h.audiobookname,
                h.audiobookuri, h.audiobookchaptername, h.audiobookchapteruri,
                h.reasonstart, h.reasonend, h.shuffle, h.skipped, h.offline,
                h.offlinets, h.incognito
            ]);

            const query = `
        INSERT INTO history (
          ts, platform, ms_played, conn_country, ipaddress,
          trackname, albumartist, albumname, spotifyuri,
          episodename, episodeshow, spotifyepisodeuri, audiobookname,
          audiobookuri, audiobookchaptername, audiobookchapteruri,
          reasonstart, reasonend, shuffle, skipped, offline, offlinets, incognito
        )
        VALUES ${values.map(
                (_, i) => `(${values[i].map((_, j) => `$${i * values[i].length + j + 1}`).join(', ')})`
            ).join(', ')}
      `;

            const flatValues = values.flat();
            await pool.query(query, flatValues);
        }

        res.status(200).json({ inserted: allEntries.length });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing ZIP');
    }
});

 */

//
// ✅ DELETE — remove an entry by ID
//
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM history WHERE historyid = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send('Not found');
        }

        res.json({ message: 'Deleted successfully', deleted: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

export default router;
