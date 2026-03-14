import { model, models, Schema, Document } from "mongoose";

export interface ISubscription {
  channelId: string;
  title: string;
  thumbnail: string;
}

export interface IUser extends Document {
  username: string;
  password?: string;
  subscriptions: ISubscription[];
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
  password: {
    type: String,
  },
  subscriptions: [SubscriptionSchema]
});

export const User = models.User || model<IUser>("User", UserSchema);