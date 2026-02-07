export default class HistoryFile {
  ts?: Date; // timestamp
  platform?: string;
  ms_played?: string | number;
  conn_country?: string;
  ip_addr?: string;
  master_metadata_track_name?: string;
  master_metadata_album_artist_name?: string;
  master_metadata_album_album_name?: string;
  spotify_track_uri?: string;
  spotify_episode_uri?: string;
  audiobook_title?: string | null;
  audiobook_uri?: string | null;
  audiobook_chapter_uri?: string | null;
  audiobook_chapter_title?: string | null;
  episode_name?: string;
  episode_show_name?: string;
  reason_start?: string;
  reason_end?: string;
  shuffle?: boolean | null;
  skipped?: boolean | null;
  offline?: boolean | null;
  offline_timestamp?: Date | null;
  incognito_mode?: boolean | null;

  constructor(data: HistoryFile) {
    this.ts = data.ts;
    this.platform = data.platform;
    this.ms_played = data.ms_played;
    this.conn_country = data.conn_country;
    this.ip_addr = data.ip_addr;
    this.master_metadata_track_name = data.master_metadata_track_name;
    this.master_metadata_album_artist_name =
      data.master_metadata_album_artist_name;
    this.master_metadata_album_album_name =
      data.master_metadata_album_album_name;
    this.spotify_track_uri = data.spotify_track_uri;
    this.spotify_episode_uri = data.spotify_episode_uri;
    this.audiobook_title = data.audiobook_title;
    this.audiobook_uri = data.audiobook_uri;
    this.audiobook_chapter_uri = data.audiobook_chapter_uri;
    this.audiobook_chapter_title = data.audiobook_chapter_title;
    this.episode_name = data.episode_name;
    this.episode_show_name = data.episode_show_name;
    this.reason_start = data.reason_start;
    this.reason_end = data.reason_end;
    this.shuffle = data.shuffle;
    this.skipped = data.skipped;
    this.offline = data.offline;
    this.offline_timestamp = data.offline_timestamp;
    this.incognito_mode = data.incognito_mode;
  }
}
