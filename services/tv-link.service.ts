import { api } from "@/services/api";

export interface Device {
  id: string;
  device_type: "mobile" | "tv" | "web";
  device_name: string;
  last_active_at: string;
  is_current: boolean;
}

export const confirmTvCode = async (code: string): Promise<void> => {
  await api.post("/api/v1/auth/tv/confirm", { code });
};

export const fetchDevices = async (): Promise<Device[]> => {
  const res = await api.get<{ data: Device[] }>("/api/v1/auth/devices");
  return res.data.data ?? [];
};

export const deleteDevice = async (deviceId: string): Promise<void> => {
  await api.delete(`/api/v1/auth/devices/${deviceId}`);
};
