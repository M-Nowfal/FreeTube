import { create } from "zustand";

interface IChannel {
  channelId: string;
  title: string;
  description?: string;
  thumbnail: string;
  totalVideos?: number;
  watchedVideos?: number;
}

interface SubscriptionsState {
  channels: IChannel[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastSynced: string | null;
  fetchSubscriptions: (username: string) => Promise<void>;
  addChannel: (channel: IChannel) => void;
  removeChannel: (channelId: string) => void;
  invalidate: () => void;
}

export const useSubscriptionsStore = create<SubscriptionsState>((set, get) => ({
  channels: [],
  loading: false,
  error: null,
  lastFetched: null,
  lastSynced: null,

  fetchSubscriptions: async (username: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/subscriptions?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        set({
          channels: data.subscriptions || data,
          lastSynced: data.lastSynced || null,
          lastFetched: Date.now(),
          loading: false,
        });
      } else {
        throw new Error("Failed to fetch subscriptions");
      }
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch subscriptions", loading: false });
    }
  },

  addChannel: (channel: IChannel) => {
    set((state) => {
      if (state.channels.some(c => c.channelId === channel.channelId)) {
        return state;
      }
      return { channels: [channel, ...state.channels] };
    });
  },

  removeChannel: (channelId: string) => {
    set((state) => ({
      channels: state.channels.filter((c) => c.channelId !== channelId),
    }));
  },

  invalidate: () => {
    set({ channels: [], lastFetched: null, lastSynced: null });
  },
}));
