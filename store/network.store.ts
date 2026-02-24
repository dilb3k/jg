import { create } from "zustand";

type NetworkState = {
  isConnected: boolean;
  hasChecked: boolean;
  monitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  checkNow: () => Promise<boolean>;
  setConnected: (value: boolean) => void;
};

let intervalRef: ReturnType<typeof setInterval> | null = null;

const fetchWithTimeout = async (url: string, timeoutMs = 4000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
};

const probeConnection = async () => {
  try {
    await fetchWithTimeout("https://clients3.google.com/generate_204");
    return true;
  } catch {
    try {
      await fetchWithTimeout("https://api.alloplay.uz", 5000);
      return true;
    } catch {
      return false;
    }
  }
};

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true,
  hasChecked: false,
  monitoring: false,

  setConnected: (value) => set({ isConnected: value, hasChecked: true }),

  checkNow: async () => {
    const connected = await probeConnection();
    set({ isConnected: connected, hasChecked: true });
    return connected;
  },

  startMonitoring: () => {
    if (get().monitoring) return;

    set({ monitoring: true });

    void get().checkNow();

    intervalRef = setInterval(() => {
      void get().checkNow();
    }, 8000);
  },

  stopMonitoring: () => {
    if (intervalRef) {
      clearInterval(intervalRef);
      intervalRef = null;
    }

    set({ monitoring: false });
  },
}));
