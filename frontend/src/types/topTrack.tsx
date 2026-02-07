import type { Track } from "./track";

export interface TopTrack {
  items: Track[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  previous: string | null;
  next: string | null;
}
