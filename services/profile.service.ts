import { api } from "@/services/api";
import { Profile } from "@/shared/types/profile";

interface ProfileResponse {
  success: boolean;
  data: unknown;
}

const normalizeProfile = (raw: any): Profile | null => {
  if (!raw || typeof raw !== "object") return null;

  const source = raw.user ?? raw.profile ?? raw;
  const fullName =
    source.full_name ??
    source.fullName ??
    source.name ??
    [source.first_name, source.last_name].filter(Boolean).join(" ");
  const phone = source.phone ?? source.phone_number ?? source.msisdn;

  if (!fullName && !phone) return null;

  return {
    avatar_url: source.avatar_url ?? source.avatar ?? undefined,
    full_name: fullName ?? "-",
    phone: phone ?? "-",
  };
};

export const getMyProfile = async (): Promise<Profile | null> => {
  const res = await api.get<ProfileResponse>("/api/v1/auth/me");
  return normalizeProfile(res.data.data);
};

export const logoutFromAccount = async () => {
  await api.post("/api/v1/auth/logout", { all_devices: false });
};

export const deleteMyAccount = async () => {
  await api.delete("/api/v1/auth/me");
};
