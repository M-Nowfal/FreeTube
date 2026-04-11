"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";

export function useAuth() {
  const { isAuth, authLoading, initAuth, user } = useUserStore();

  useEffect(() => {
    initAuth();
  }, []);

  return { isAuth, loading: authLoading, user };
}
