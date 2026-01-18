"use client";

import { API_URL } from "@/utils/constants";
import axios, { AxiosError } from "axios";
import { useState } from "react";

type HTTPMethods = "POST" | "PATCH" | "PUT" | "DELETE";

export function useMutate(method: HTTPMethods = "POST") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>();

  async function mutate(
    url: string,
    body?: Record<string, any>,
    headers: Record<string, any> = {},
    method2?: HTTPMethods
  ) {
    setLoading(true);
    setError("");
    try {
      const config = { withCredentials: true, headers };
      let response;
      const finalHTTPMethod = method2 || method;
      switch (finalHTTPMethod) {
        case "POST":
          response = await axios.post(API_URL + url, body, config);
          break;
        case "PATCH":
          response = await axios.patch(API_URL + url, body, config);
          break;
        case "PUT":
          response = await axios.put(API_URL + url, body, config);
          break;
        case "DELETE":
          response = await axios.delete(API_URL + url, config);
          break;
      }

      setData(response?.data);
      return response?.data;
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message || err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, mutate };
}