"use client";

import { useUserStore } from "@/store/useUserStore";
import { API_URL } from "@/utils/constants";
import axios from "axios";
import { useEffect, useState } from "react";

type UseAuth = {
  isAuth: boolean;
  loading: boolean;
  setIsAuth: (auth: boolean) => void;
};

export function useAuth(): UseAuth {
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const { setUser } = useUserStore();

  async function getCurrentUser(): Promise<void> {
    const response = await axios.get(
      `${API_URL}/auth/me`,
      { withCredentials: true }
    );
    if (response.status === 200) {
      setIsAuth(true);
      setUser(response.data?.user);
    } else
      setIsAuth(false);
  }

  useEffect(() => {
    setLoading(true);
    getCurrentUser()
      .catch(() => setIsAuth(false))
      .finally(() => setLoading(false));
  }, []);

  return { isAuth, loading, setIsAuth };
}