import { IPlaylist } from "./playlist";

export interface IUser {
  _id?: string;
  username: string;
  profile: string;
  email: string;
  password?: string;
  playlist: IPlaylist[];
  videos: string[];
}