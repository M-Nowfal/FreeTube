import { IUser } from "@/types/user";
import { create } from "zustand";

interface UserState {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
