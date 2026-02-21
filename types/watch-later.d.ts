import { Document } from "mongoose";

export interface IWatchLater extends Document {
  username: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  watched: boolean;
}
