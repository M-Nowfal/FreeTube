export interface IShort {
  _id?: string;
  username: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail?: string;
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration: number;
  views?: number;
  likes?: number;
  liked?: boolean;
  watched?: boolean;
  updatedAt?: string;
}
