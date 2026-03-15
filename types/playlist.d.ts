export interface IVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  watched?: boolean;
}

export interface IPlaylist {
  username: string;
  channelTitle: string;
  videos: IVideo[];
}