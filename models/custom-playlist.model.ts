import { IVideo } from "@/types/playlist";
import { model, models, Schema, Document } from "mongoose";

export interface ICustomPlaylist extends Document {
  username: string;
  playlistName: string;
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

const CustomPlaylistSchema = new Schema<ICustomPlaylist>({
  username: {
    type: String,
    required: true
  },
  playlistName: {
    type: String,
    required: true
  },
  videos: [VideoSchema]
}, { timestamps: true });

CustomPlaylistSchema.index({ username: 1, playlistName: 1 }, { unique: true });

export const CustomPlaylist = models.CustomPlaylist || model<ICustomPlaylist>("CustomPlaylist", CustomPlaylistSchema);
