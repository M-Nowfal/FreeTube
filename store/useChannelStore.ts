import { create } from "zustand";
import axios from "axios";
import { IVideo } from "@/types/playlist";

interface IChannelInfo {
  channelId: string;
  title: string;
  thumbnail?: string;
}

interface ChannelCacheEntry {
  channelInfo: IChannelInfo;
  videos: IVideo[];
  playlistUpdatedAt: string | null;
  lastFetched: number;
}

interface ChannelState {
  cache: Record<string, ChannelCacheEntry>;
  loading: boolean;
  error: string | null;
  fetchChannel: (channelId: string, username: string, title: string) => Promise<void>;
  getChannelData: (channelId: string) => ChannelCacheEntry | undefined;
  updateChannelVideos: (channelId: string, videos: IVideo[]) => void;
  markVideoWatched: (channelId: string, videoId: string) => void;
  invalidate: (channelId: string) => void;
  invalidateAll: () => void;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  cache: {},
  loading: false,
  error: null,

  fetchChannel: async (channelId: string, username: string, title: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/channels/${channelId}/videos?username=${username}&title=${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error("Failed to load channel data");

      const data = await res.json();

      set((state) => ({
        cache: {
          ...state.cache,
          [channelId]: {
            channelInfo: data.channelInfo,
            videos: data.videos,
            playlistUpdatedAt: data.playlistUpdatedAt || null,
            lastFetched: Date.now(),
          },
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch channel", loading: false });
    }
  },

  getChannelData: (channelId: string) => {
    return get().cache[channelId];
  },

  updateChannelVideos: (channelId: string, videos: IVideo[]) => {
    set((state) => {
      if (!state.cache[channelId]) return state;
      return {
        cache: {
          ...state.cache,
          [channelId]: {
            ...state.cache[channelId],
            videos,
            lastFetched: Date.now(),
          },
        },
      };
    });
  },

  markVideoWatched: (channelId: string, videoId: string) => {
    set((state) => {
      if (!state.cache[channelId]) return state;
      return {
        cache: {
          ...state.cache,
          [channelId]: {
            ...state.cache[channelId],
            videos: state.cache[channelId].videos.map((v) =>
              v.videoId === videoId ? { ...v, watched: true } : v
            ),
          },
        },
      };
    });
  },

  invalidate: (channelId: string) => {
    set((state) => {
      const newCache = { ...state.cache };
      delete newCache[channelId];
      return { cache: newCache };
    });
  },

  invalidateAll: () => {
    set({ cache: {} });
  },
}));
