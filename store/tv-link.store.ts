import { confirmTvCode, deleteDevice, Device, fetchDevices } from "@/services/tv-link.service";
import { create } from "zustand";

export type ConfirmStatus = "idle" | "success" | "error";

interface TvLinkState {
  devices: Device[];
  loadingDevices: boolean;
  confirming: boolean;
  confirmStatus: ConfirmStatus;
  fetchDevices: () => Promise<void>;
  confirm: (code: string) => Promise<boolean>;
  removeDevice: (id: string) => Promise<void>;
  resetStatus: () => void;
}

export const useTvLinkStore = create<TvLinkState>((set, get) => ({
  devices: [],
  loadingDevices: false,
  confirming: false,
  confirmStatus: "idle",

  fetchDevices: async () => {
    set({ loadingDevices: true });
    try {
      const devices = await fetchDevices();
      const sortedDevices = [...devices].sort((a, b) => {
        if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
        return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
      });
      set({ devices: sortedDevices, loadingDevices: false });
    } catch {
      set({ loadingDevices: false });
    }
  },

  confirm: async (code: string) => {
    set({ confirming: true, confirmStatus: "idle" });
    try {
      await confirmTvCode(code);
      set({ confirming: false, confirmStatus: "success" });
      void get().fetchDevices();
      return true;
    } catch {
      set({ confirming: false, confirmStatus: "error" });
      return false;
    }
  },

  removeDevice: async (id: string) => {
    set((s) => ({ devices: s.devices.filter((d) => d.id !== id) }));
    try {
      await deleteDevice(id);
    } catch {
      void get().fetchDevices();
    }
  },

  resetStatus: () => set({ confirmStatus: "idle" }),
}));
