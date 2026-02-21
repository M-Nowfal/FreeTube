export interface IVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  watched?: boolean;
}

export interface IPlaylist {
  username: string;
  channelTitle: string;
  videos: IVideo[];
}