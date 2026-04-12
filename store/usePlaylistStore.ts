import { create } from "zustand";
import axios from "axios";
import { IPlaylist, IVideo, ICustomPlaylist } from "@/types/playlist";
import { API_URL } from "@/utils/constants";

interface PlaylistCache {
  playlists: (IPlaylist & { _id: string })[];
  lastFetched: number;
  lastSynced: string | null;
}

interface CustomPlaylistCache {
  playlists: ICustomPlaylist[];
  lastFetched: number;
}

interface PlaylistState {
  cache: PlaylistCache | null;
  customCache: CustomPlaylistCache | null;
  loading: boolean;
  customLoading: boolean;
  error: string | null;
  fetchPlaylists: (username: string) => Promise<void>;
  getPlaylistById: (id: string) => (IPlaylist & { _id: string }) | undefined;
  updatePlaylistVideos: (playlistId: string, videos: IVideo[]) => void;
  addVideoToPlaylist: (playlistId: string, video: IVideo) => void;
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => void;
  addNewPlaylist: (playlist: IPlaylist & { _id: string }) => void;
  deletePlaylist: (id: string) => void;
  invalidate: () => void;
  fetchCustomPlaylists: (username: string) => Promise<void>;
  getCustomPlaylistById: (id: string) => ICustomPlaylist | undefined;
  createCustomPlaylist: (data: { username: string; playlistName: string; videoUrls: string[] }) => Promise<ICustomPlaylist>;
  deleteCustomPlaylist: (id: string) => Promise<void>;
  removeVideoFromCustomPlaylist: (playlistId: string, videoId: string) => Promise<void>;
  invalidateCustom: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  cache: null,
  customCache: null,
  loading: false,
  customLoading: false,
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

  fetchCustomPlaylists: async (username: string) => {
    set({ customLoading: true, error: null });
    try {
      const { data } = await axios.get(`${API_URL}/custom-playlist?username=${username}`);
      set({
        customCache: {
          playlists: data.playlists,
          lastFetched: Date.now(),
        },
        customLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch custom playlists", customLoading: false });
    }
  },

  getCustomPlaylistById: (id: string) => {
    const { customCache } = get();
    return customCache?.playlists.find((p) => p._id === id);
  },

  createCustomPlaylist: async (data: { username: string; playlistName: string; videoUrls: string[] }) => {
    const { data: response } = await axios.post(`${API_URL}/custom-playlist`, data);
    const newPlaylist = response.playlist;
    
    set((state) => {
      if (!state.customCache) {
        return {
          customCache: {
            playlists: [newPlaylist],
            lastFetched: Date.now(),
          },
        };
      }
      return {
        customCache: {
          ...state.customCache,
          playlists: [newPlaylist, ...state.customCache.playlists],
          lastFetched: Date.now(),
        },
      };
    });
    
    return newPlaylist;
  },

  deleteCustomPlaylist: async (id: string) => {
    await axios.delete(`${API_URL}/custom-playlist?id=${id}`);
    set((state) => {
      if (!state.customCache) return state;
      return {
        customCache: {
          ...state.customCache,
          playlists: state.customCache.playlists.filter((p) => p._id !== id),
          lastFetched: Date.now(),
        },
      };
    });
  },

  removeVideoFromCustomPlaylist: async (playlistId: string, videoId: string) => {
    const { data } = await axios.patch(`${API_URL}/custom-playlist/${playlistId}`, {
      action: "remove_video",
      videoId,
    });
    const updatedPlaylist = data.playlist;
    
    set((state) => {
      if (!state.customCache) return state;
      return {
        customCache: {
          ...state.customCache,
          playlists: state.customCache.playlists.map((p) =>
            p._id === playlistId ? updatedPlaylist : p
          ),
          lastFetched: Date.now(),
        },
      };
    });
  },

  invalidateCustom: () => {
    set({ customCache: null });
  },
}));
