export interface SpotifyImage {
  url: string;
  height?: number | null;
  width?: number | null;
}

export interface SpotifyFollowers {
  href: string | null;
  total: number;
}

export interface SpotifyExternalUrls {
  spotify?: string;
  [key: string]: any;
}

export interface SpotifyUser {
  country?: string;
  display_name?: string;
  email?: string;
  explicit_content?: {
    filter_enabled?: boolean;
    filter_locked?: boolean;
  };
  external_urls?: SpotifyExternalUrls;
  followers?: SpotifyFollowers;
  href?: string;
  id?: string;
  images?: SpotifyImage[];
  product?: string;
  type?: string;
  uri?: string;
  [key: string]: any;
}

// Note: interfaces are exported above; don't use `export default` for a type-only symbol.
