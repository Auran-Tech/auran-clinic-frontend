import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { BaseResponse } from "./contracts";
import { authSession } from "../../features/auth/authSession";
import { apiBaseUrl, currentLocale } from "./config";

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authSession.get()?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Accept-Language"] = currentLocale();
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  response => response,
  async (error: AxiosError<BaseResponse<unknown>>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (!original || error.response?.status !== 401 || original._retried || original.url?.includes("/auth/")) {
      return Promise.reject(error);
    }

    original._retried = true;
    refreshing ??= authSession.refreshAccessToken().finally(() => { refreshing = null; });
    const token = await refreshing;
    if (!token) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  }
);
