import { IUser } from "@/types/user";
import { model, models, Schema } from "mongoose";

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  password: {
    type: String,
  },
  playlist: [{
    type: Schema.Types.ObjectId,
    ref: "Playlist"
  }],
  videos: [{
    type: String,
  }]
});

UserSchema.index({ username: 1, email: 1 });

export const User = models.User || model<IUser>("User", UserSchema);