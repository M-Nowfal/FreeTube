import { create } from "zustand";
import axios from "axios";
import { IShort } from "@/types/short";
import { API_URL } from "@/utils/constants";

interface ShortsState {
  shorts: IShort[];
  currentIndex: number;
  loading: boolean;
  hasMore: boolean;
  page: number;
  username: string | null;
  error: string | null;
  fetchShorts: (username: string, reset?: boolean) => Promise<void>;
  likeShort: (shortId: string) => Promise<void>;
  markWatched: (shortId: string) => Promise<void>;
  setCurrentIndex: (index: number) => void;
  invalidate: () => void;
}

export const useShortsStore = create<ShortsState>((set, get) => ({
  shorts: [],
  currentIndex: 0,
  loading: false,
  hasMore: true,
  page: 1,
  username: null,
  error: null,

  fetchShorts: async (username: string, reset: boolean = false) => {
    const { loading, hasMore, page } = get();
    
    if (loading || (!hasMore && !reset)) return;

    const newPage = reset ? 1 : page;

    set({ loading: true, error: null, username });

    try {
      const { data } = await axios.get(`${API_URL}/shorts?username=${username}&page=${newPage}&limit=10`);
      
      set((state) => ({
        shorts: reset 
          ? data.shorts 
          : [...state.shorts, ...data.shorts],
        page: newPage + 1,
        hasMore: data.hasMore,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch shorts", loading: false });
    }
  },

  likeShort: async (shortId: string) => {
    const { username } = get();
    if (!username) return;
    
    try {
      const { data } = await axios.post(`${API_URL}/shorts`, {
        action: "like",
        shortId,
        username,
      });

      set((state) => ({
        shorts: state.shorts.map((short) =>
          short._id === shortId
            ? { ...short, liked: data.liked, likes: data.likes }
            : short
        ),
      }));
    } catch (error) {
      console.error("Failed to like short:", error);
    }
  },

  markWatched: async (shortId: string) => {
    const { username } = get();
    if (!username) return;
    
    try {
      await axios.post(`${API_URL}/shorts`, {
        action: "watched",
        shortId,
        username,
      });

      set((state) => ({
        shorts: state.shorts.map((short) =>
          short._id === shortId
            ? { ...short, watched: true }
            : short
        ),
      }));
    } catch (error) {
      console.error("Failed to mark short as watched:", error);
    }
  },

  setCurrentIndex: (index: number) => {
    set({ currentIndex: index });
  },

  invalidate: () => {
    set({
      shorts: [],
      currentIndex: 0,
      page: 1,
      hasMore: true,
      error: null,
    });
  },
}));
