import { IUser } from "@/types/user";
import { model, models, Schema } from "mongoose";

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  password: {
    type: String,
  },
});

export const User = models.User || model<IUser>("User", UserSchema);