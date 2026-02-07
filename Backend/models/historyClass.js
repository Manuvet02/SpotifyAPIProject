export default class HistoryFile {
    constructor(data = {}) {
        this.ts                     = data.ts ? new Date(data.ts) : null;
        this.platform               = data.platform || null;
        this.ms_played              = data.ms_played || 0;
        this.conn_country           = data.conn_country || null;
        this.ipaddress              = data.ip_addr || null;
        this.trackname              = data.master_metadata_track_name || null;
        this.albumartist            = data.master_metadata_album_artist_name || null;
        this.albumname              = data.master_metadata_album_album_name || null;
        this.spotifyuri             = data.spotify_track_uri || null;
        this.episodename            = data.episode_name || null;
        this.episodeshow            = data.episode_show_name || null;
        this.spotifyepisodeuri      = data.spotify_episode_uri || null;
        this.audiobookname          = data.audiobook_title || null;
        this.audiobookuri           = data.audiobook_uri || null;
        this.audiobookchaptername   = data.audiobook_chapter_title || null;
        this.audiobookchapteruri    = data.audiobook_chapter_uri || null;
        this.reasonstart            = data.reason_start || null;
        this.reasonend              = data.reason_end || null;
        this.shuffle                = data.shuffle ?? null;
        this.skipped                = data.skipped ?? null;
        this.offline                = data.offline ?? null;
        this.offlinets              = data.offline_timestamp ? new Date(data.offline_timestamp) : null;
        this.incognito              = data.incognito_mode ?? null;
    }
}
