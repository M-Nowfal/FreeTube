import { create } from "zustand";
import axios from "axios";

interface IWatchLaterVideo {
  _id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  watched: boolean;
}

interface WatchLaterState {
  videos: IWatchLaterVideo[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchVideos: (username: string) => Promise<void>;
  addVideo: (video: IWatchLaterVideo) => void;
  removeVideo: (id: string) => void;
  markWatched: (id: string) => void;
  invalidate: () => void;
}

export const useWatchLaterStore = create<WatchLaterState>((set, get) => ({
  videos: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchVideos: async (username: string) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.get(`/api/watch-later?username=${username}`);
      set({
        videos: data.videos,
        lastFetched: Date.now(),
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch videos", loading: false });
    }
  },

  addVideo: (video: IWatchLaterVideo) => {
    set((state) => ({
      videos: [video, ...state.videos],
    }));
  },

  removeVideo: (id: string) => {
    set((state) => ({
      videos: state.videos.filter((v) => v._id !== id),
    }));
  },

  markWatched: (id: string) => {
    set((state) => ({
      videos: state.videos.map((v) =>
        v._id === id ? { ...v, watched: true } : v
      ),
    }));
  },

  invalidate: () => {
    set({ videos: [], lastFetched: null });
  },
}));
