import { IPlaylist } from "@/types/playlist";
import { model, models, Schema } from "mongoose";

const PlaylistSchema = new Schema<IPlaylist>({
  username: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  videos: [{
    type: String
  }]
});

PlaylistSchema.index({ username: 1, title: 1 });

export const Playlist = models.Playlist || model<IPlaylist>("Playlist", PlaylistSchema);