import { IWatchLater } from "@/types/watch-later";
import { model, models, Schema } from "mongoose";

const WatchLaterSchema = new Schema<IWatchLater>({
  username: { type: String, required: true },
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  thumbnail: { type: String, required: true },
  channelTitle: { type: String, required: true },
  watched: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure a user can't add the same video to "Watch Later" twice
WatchLaterSchema.index({ username: 1, videoId: 1 }, { unique: true });

export const WatchLater = models.WatchLater || model<IWatchLater>("WatchLater", WatchLaterSchema);