import { create } from "zustand";
import axios from "axios";
import { IPlaylist, IVideo } from "@/types/playlist";
import { API_URL } from "@/utils/constants";

interface PlaylistCache {
  playlists: (IPlaylist & { _id: string })[];
  lastFetched: number;
  lastSynced: string | null;
  username?: string;
}

interface PlaylistState {
  cache: PlaylistCache | null;
  loading: boolean;
  error: string | null;
  fetchPlaylists: (username: string, force?: boolean) => Promise<void>;
  getPlaylistById: (id: string) => (IPlaylist & { _id: string }) | undefined;
  updatePlaylistVideos: (playlistId: string, videos: IVideo[]) => void;
  addVideoToPlaylist: (playlistId: string, video: IVideo) => void;
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => void;
  addNewPlaylist: (playlist: IPlaylist & { _id: string }) => void;
  deletePlaylist: (id: string) => Promise<void>;
  createPlaylist: (username: string, playlistName: string, videoUrls: string[]) => Promise<IPlaylist & { _id: string }>;
  invalidate: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  cache: null,
  loading: false,
  error: null,

  fetchPlaylists: async (username: string, force = false) => {
    const { cache, loading } = get();
    
    // Skip if already loading
    if (loading) return;
    
    // Skip if we have valid cache for this username and not forcing refresh
    if (!force && cache?.username === username && cache.playlists.length > 0) {
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const { data } = await axios.get(`${API_URL}/playlists?username=${username}`);
      set({
        cache: {
          playlists: data.playlists,
          lastFetched: Date.now(),
          lastSynced: data.lastSynced || null,
          username,
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
            username: (playlist as any).username,
          },
        };
      }
      
      // Check if playlist already exists (by _id or channelTitle)
      const existingIndex = state.cache.playlists.findIndex(
        (p) => p._id === playlist._id || p.channelTitle === playlist.channelTitle
      );
      
      let updatedPlaylists;
      if (existingIndex >= 0) {
        // Update existing playlist
        updatedPlaylists = [...state.cache.playlists];
        updatedPlaylists[existingIndex] = playlist;
      } else {
        // Add new playlist
        updatedPlaylists = [playlist, ...state.cache.playlists];
      }
      
      return {
        cache: {
          ...state.cache,
          playlists: updatedPlaylists,
          lastFetched: Date.now(),
        },
      };
    });
  },

  deletePlaylist: async (id: string) => {
    await axios.delete(`${API_URL}/playlists/${id}`);
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

  createPlaylist: async (username: string, playlistName: string, videoUrls: string[]) => {
    const { data } = await axios.post(`${API_URL}/playlists`, {
      username,
      channelTitle: playlistName,
      videoUrls,
      isCustom: true,
    });
    const newPlaylist = data.playlist;
    
    set((state) => {
      if (!state.cache) {
        return {
          cache: {
            playlists: [newPlaylist],
            lastFetched: Date.now(),
            lastSynced: null,
            username,
          },
        };
      }
      return {
        cache: {
          ...state.cache,
          playlists: [newPlaylist, ...state.cache.playlists],
          lastFetched: Date.now(),
        },
      };
    });
    
    return newPlaylist;
  },
}));