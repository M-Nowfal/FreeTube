import { IPlaylist, IVideo } from "@/types/playlist";
import { model, models, Schema } from "mongoose";

const VideoSchema = new Schema<IVideo>({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  thumbnail: { type: String, required: true },
  channelTitle: { type: String, required: true },
  publishedAt: { type: String },
  watched: { type: Boolean, default: false },
  duration: { type: Number }
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
  videos: [VideoSchema],
  isCustom: { type: Boolean, default: false }
}, { timestamps: true });

PlaylistSchema.index({ username: 1, channelTitle: 1 });

export const Playlist = models.Playlist || model<IPlaylist>("Playlist", PlaylistSchema);