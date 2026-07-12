import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { authStore } from "../lib/authStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = authStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

// Serializes concurrent refresh attempts so a burst of 401s from parallel
// requests triggers exactly one token refresh, not one per request.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = authStore.getState();
  if (!refreshToken) throw new Error("No refresh token available");

  const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
    refreshToken,
  });

  const tokens = response.data.data as { accessToken: string; refreshToken: string };
  authStore.setTokens(tokens);
  return tokens.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried) {
      throw error;
    }

    // Never attempt to refresh on the refresh/login endpoints themselves.
    if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
      authStore.clear();
      throw error;
    }

    originalRequest._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      authStore.clear();
      throw refreshError;
    }
  }
);
