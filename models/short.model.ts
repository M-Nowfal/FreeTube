import { model, models, Schema, Document } from "mongoose";

export interface IShortDocument extends Document {
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
}

const ShortSchema = new Schema<IShortDocument>({
  username: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  channelTitle: {
    type: String,
    required: true
  },
  channelThumbnail: {
    type: String
  },
  videoId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  publishedAt: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  liked: {
    type: Boolean,
    default: false
  },
  watched: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

ShortSchema.index({ username: 1, videoId: 1 }, { unique: true });
ShortSchema.index({ username: 1, publishedAt: 1 });

export const Short = models.Short || model<IShortDocument>("Short", ShortSchema);
