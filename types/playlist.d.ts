export interface IVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt?: string;
  watched?: boolean;
  duration?: number;
}

export interface IPlaylist {
  username: string;
  channelTitle: string;
  videos: IVideo[];
  isCustom?: boolean;
  updatedAt?: string;
  lastSyncedAt?: string;
}
