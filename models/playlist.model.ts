import { IVideo } from "@/types/playlist";
import { model, models, Schema, Document } from "mongoose";

export interface IPlaylist extends Document {
  username: string;
  channelTitle: string;
  videos: IVideo[];
}

const VideoSchema = new Schema<IVideo>({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  thumbnail: { type: String, required: true },
  channelTitle: { type: String, required: true },
  publishedAt: { type: String },
  watched: { type: Boolean, default: false }
});

const PlaylistSchema = new Schema<IPlaylist>({
  username: {
    type: String,
    required: true
  },
  channelTitle: {
    type: String,
    required: true
  },
  videos: [VideoSchema]
});

PlaylistSchema.index({ username: 1, channelTitle: 1 });

export const Playlist = models.Playlist || model<IPlaylist>("Playlist", PlaylistSchema);