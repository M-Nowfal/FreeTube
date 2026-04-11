import { create } from "zustand";
import axios from "axios";
import { IPlaylist, IVideo } from "@/types/playlist";
import { API_URL } from "@/utils/constants";

interface PlaylistCache {
  playlists: (IPlaylist & { _id: string })[];
  lastFetched: number;
  lastSynced: string | null;
}

interface PlaylistState {
  cache: PlaylistCache | null;
  loading: boolean;
  error: string | null;
  fetchPlaylists: (username: string) => Promise<void>;
  getPlaylistById: (id: string) => (IPlaylist & { _id: string }) | undefined;
  updatePlaylistVideos: (playlistId: string, videos: IVideo[]) => void;
  addVideoToPlaylist: (playlistId: string, video: IVideo) => void;
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => void;
  addNewPlaylist: (playlist: IPlaylist & { _id: string }) => void;
  deletePlaylist: (id: string) => void;
  invalidate: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  cache: null,
  loading: false,
  error: null,

  fetchPlaylists: async (username: string) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.get(`${API_URL}/playlists?username=${username}`);
      set({
        cache: {
          playlists: data.playlists,
          lastFetched: Date.now(),
          lastSynced: data.lastSynced || null,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch playlists", loading: false });
    }
  },

  getPlaylistById: (id: string) => {
    const { cache } = get();
    return cache?.playlists.find((p) => p._id === id);
  },

  updatePlaylistVideos: (playlistId: string, videos: IVideo[]) => {
    set((state) => {
      if (!state.cache) return state;
      return {
        cache: {
          ...state.cache,
          playlists: state.cache.playlists.map((p) =>
            p._id === playlistId ? { ...p, videos } : p
          ),
          lastFetched: Date.now(),
        },
      };
    });
  },

  addVideoToPlaylist: (playlistId: string, video: IVideo) => {
    set((state) => {
      if (!state.cache) return state;
      return {
        cache: {
          ...state.cache,
          playlists: state.cache.playlists.map((p) =>
            p._id === playlistId ? { ...p, videos: [video, ...p.videos] } : p
          ),
          lastFetched: Date.now(),
        },
      };
    });
  },

  removeVideoFromPlaylist: (playlistId: string, videoId: string) => {
    set((state) => {
      if (!state.cache) return state;
      return {
        cache: {
          ...state.cache,
          playlists: state.cache.playlists.map((p) =>
            p._id === playlistId
              ? { ...p, videos: p.videos.filter((v) => v.videoId !== videoId) }
              : p
          ),
          lastFetched: Date.now(),
        },
      };
    });
  },

  addNewPlaylist: (playlist: IPlaylist & { _id: string }) => {
    set((state) => {
      if (!state.cache) {
        return {
          cache: {
            playlists: [playlist],
            lastFetched: Date.now(),
            lastSynced: null,
          },
        };
      }
      return {
        cache: {
          ...state.cache,
          playlists: [playlist, ...state.cache.playlists],
          lastFetched: Date.now(),
        },
      };
    });
  },

  deletePlaylist: (id: string) => {
    set((state) => {
      if (!state.cache) return state;
      return {
        cache: {
          ...state.cache,
          playlists: state.cache.playlists.filter((p) => p._id !== id),
          lastFetched: Date.now(),
        },
      };
    });
  },

  invalidate: () => {
    set({ cache: null });
  },
}));
