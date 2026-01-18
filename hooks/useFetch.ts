"use client"

import { API_URL } from "@/utils/constants";
import axios, { AxiosError } from "axios";
import { useState } from "react"

interface UseFetch {
  data: any;
  loading: boolean;
  error: string;
  refetch: (url: string) => Promise<void>;
  clearFetch: () => void;
}

export function useFetch(): UseFetch {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function fetchData(url: string) {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}${url}`, { withCredentials: true });
      if (response.status === 200)
        setData(response.data);
    } catch (err: unknown) {
      const error = err instanceof AxiosError ? err.response?.data?.message || err.message : String(err);
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  const clearFetch = () => {
    setData(null);
    setError("");
    setLoading(false);
  };

  return { data, loading, error, refetch: fetchData, clearFetch };
}