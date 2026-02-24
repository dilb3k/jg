import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/store/auth.store";
import { useSettingsStore } from "@/store/settings.store";

export const api = axios.create({
  baseURL: "https://api.alloplay.uz",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "uz",
  },
});

export const publicApi = axios.create({
  baseURL: "https://api.alloplay.uz",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "uz",
  },
});

/* =====================
   AUTH INTERCEPTOR
===================== */
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("accessToken");
    const language = useSettingsStore.getState().language;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Accept-Language"] = language;

    if (__DEV__) {
      console.log("➡️ REQUEST:", {
        url: config.url,
        method: config.method,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    if (__DEV__) console.log("❌ REQUEST ERROR:", error.message);
    return Promise.reject(error);
  },
);

publicApi.interceptors.request.use(
  (config) => {
    const language = useSettingsStore.getState().language;
    config.headers["Accept-Language"] = language;
    return config;
  },
  (error) => Promise.reject(error),
);

/* =====================
   RESPONSE INTERCEPTOR (с refresh логикой)
===================== */
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("✅ RESPONSE:", {
        url: response.config.url,
        status: response.status,
      });
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.log("❌ RESPONSE ERROR:", {
        url: error.config?.url,
        status: error.response?.status,
      });
    }

    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      const res = await axios.post(`${api.defaults.baseURL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token } = res.data.data.tokens;

      await SecureStore.setItemAsync("accessToken", access_token);
      await SecureStore.setItemAsync("refreshToken", refresh_token);

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      processQueue(null, access_token);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await useAuthStore.getState().expireSession();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
