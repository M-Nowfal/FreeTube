import { IUser } from "@/types/user";
import { create } from "zustand";
import axios from "axios";
import { API_URL } from "@/utils/constants";

interface UserState {
  user: IUser | null;
  isAuth: boolean;
  authLoading: boolean;
  authInitialized: boolean;
  setUser: (user: IUser | null) => void;
  clearUser: () => void;
  initAuth: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuth: false,
  authLoading: true,
  authInitialized: false,

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null, isAuth: false }),

  initAuth: async () => {
    if (get().authInitialized) return;

    set({ authLoading: true });

    try {
      const response = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      if (response.status === 200) {
        set({ user: response.data?.user || null, isAuth: true, authLoading: false, authInitialized: true });
      } else {
        set({ user: null, isAuth: false, authLoading: false, authInitialized: true });
      }
    } catch {
      set({ user: null, isAuth: false, authLoading: false, authInitialized: true });
    }
  },
}));
