import { deleteMyAccount, getMyProfile, logoutFromAccount } from "@/services/profile.service";
import { Profile } from "@/shared/types/profile";
import { useAuthStore } from "@/store/auth.store";
import { isAxiosError } from "axios";
import { create } from "zustand";

type ProfileStatus = "idle" | "loading" | "ready" | "unauthorized" | "error";

interface ProfileState {
  profile: Profile | null;
  status: ProfileStatus;
  error: string | null;
  fetchProfile: () => Promise<ProfileStatus>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  status: "idle",
  error: null,

  fetchProfile: async () => {
    set({ status: "loading", error: null });

    try {
      const profile = await getMyProfile();
      if (!profile) {
        const localUser = useAuthStore.getState().user as Record<string, unknown> | null;
        const fallbackProfile = localUser
          ? {
              avatar_url:
                (localUser.avatar_url as string | undefined) ??
                (localUser.avatar as string | undefined),
              full_name:
                (localUser.full_name as string | undefined) ??
                (localUser.name as string | undefined) ??
                "-",
              phone:
                (localUser.phone as string | undefined) ??
                (localUser.phone_number as string | undefined) ??
                "-",
            }
          : null;

        if (fallbackProfile) {
          set({ profile: fallbackProfile, status: "ready", error: null });
          return "ready";
        }
      }

      if (profile) {
        set({ profile, status: "ready", error: null });
        return "ready";
      }

      set({ profile: null, status: "error", error: "Failed to load profile" });
      return "error";
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        await useAuthStore.getState().expireSession();
        set({ profile: null, status: "unauthorized", error: null });
        return "unauthorized";
      }

      set({ status: "error", error: "Failed to load profile" });
      return "error";
    }
  },

  logout: async () => {
    try {
      await logoutFromAccount();
    } catch {
      // Ignore backend logout errors and clear local session.
    }

    await useAuthStore.getState().logout();
    set({ profile: null, status: "idle", error: null });
  },

  deleteAccount: async () => {
    try {
      await deleteMyAccount();
    } catch {
      // Some backends may not support this endpoint.
    }

    await useAuthStore.getState().logout();
    set({ profile: null, status: "idle", error: null });
  },

  clear: () => set({ profile: null, status: "idle", error: null }),
}));
