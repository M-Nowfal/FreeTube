import { model, models, Schema, Document } from "mongoose";

export interface ISubscription {
  channelId: string;
  title: string;
  thumbnail: string;
}

export interface IUser extends Document {
  username: string;
  email?: string;
  password?: string;
  subscriptions: ISubscription[];
  resetToken?: string;
  resetTokenExpiry?: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  channelId: { type: String, required: true },
  title: { type: String, required: true },
  thumbnail: { type: String, required: true },
});

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
    unique: true,
    sparse: true
  },
  password: {
    type: String,
  },
  subscriptions: [SubscriptionSchema],
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  }
});

export const User = models.User || model<IUser>("User", UserSchema);