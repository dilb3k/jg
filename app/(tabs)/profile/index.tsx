import { useI18n } from "@/shared/i18n/useI18n";
import { useToast } from "@/shared/ui/toast";
import { useProfileStore } from "@/store/profile.store";
import { useSettingsStore } from "@/store/settings.store";
import { useRouter } from "expo-router";
import {
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Globe,
  History,
  Info,
  LogOut,
  Pencil,
  Trash2,
  Tv,
  UserRound,
} from "lucide-react-native";
import { ComponentType, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ConfirmType = "logout" | "delete" | null;

type MenuItem = {
  key: string;
  title: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isDanger?: boolean;
  isToggle?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { showToast } = useToast();

  const profile = useProfileStore((state) => state.profile);
  const status = useProfileStore((state) => state.status);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const logout = useProfileStore((state) => state.logout);
  const deleteAccount = useProfileStore((state) => state.deleteAccount);

  const language = useSettingsStore((state) => state.language);
  const pushEnabled = useSettingsStore((state) => state.pushNotificationsEnabled);
  const setPushEnabled = useSettingsStore((state) => state.setPushNotificationsEnabled);

  const [confirmType, setConfirmType] = useState<ConfirmType>(null);

  useEffect(() => {
    const init = async () => {
      const result = await fetchProfile();
      if (result === "unauthorized") {
        router.replace("/(auth)/login");
      }
      if (result === "error") {
        showToast({ type: "error", message: t("common.error") });
      }
    };

    init();
  }, [fetchProfile, router, showToast, t]);

  const languageValue =
    language === "uz"
      ? t("language.uz")
      : language === "en"
        ? t("language.en")
        : t("language.ru");

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        key: "account",
        title: t("profile.accountAndSubscription"),
        icon: UserRound,
        showChevron: true,
        onPress: () => showToast({ type: "warning", message: t("common.noData") }),
      },
      {
        key: "history",
        title: t("profile.history"),
        icon: History,
        showChevron: true,
        onPress: () => showToast({ type: "warning", message: t("common.noData") }),
      },
      {
        key: "connectTv",
        title: t("profile.connectTv"),
        icon: Tv,
        showChevron: true,
        onPress: () => router.push("/profile/tv-link"),
      },
      {
        key: "saved",
        title: t("profile.saved"),
        icon: Bookmark,
        showChevron: true,
        onPress: () => router.push("/profile/saved"),
      },
      {
        key: "notifications",
        title: t("profile.notifications"),
        icon: Bell,
        showChevron: true,
        onPress: () => router.push("/profile/notifications"),
      },
      {
        key: "push",
        title: t("profile.pushNotifications"),
        icon: Bell,
        isToggle: true,
      },
      {
        key: "language",
        title: t("profile.language"),
        icon: Globe,
        value: languageValue,
        showChevron: true,
        onPress: () => router.push("/profile/language"),
      },
      {
        key: "support",
        title: t("profile.support"),
        icon: CircleHelp,
        showChevron: true,
        onPress: () => showToast({ type: "warning", message: t("common.noData") }),
      },
      {
        key: "about",
        title: t("profile.about"),
        icon: Info,
        showChevron: true,
        onPress: () => showToast({ type: "warning", message: t("common.noData") }),
      },
      {
        key: "logout",
        title: t("profile.logout"),
        icon: LogOut,
        showChevron: true,
        onPress: () => setConfirmType("logout"),
      },
      {
        key: "delete",
        title: t("profile.deleteAccount"),
        icon: Trash2,
        isDanger: true,
        showChevron: true,
        onPress: () => setConfirmType("delete"),
      },
    ],
    [languageValue, router, showToast, t],
  );

  if (status === "loading" && !profile) {
    return (
      <View className="flex-1 bg-[#07090D] items-center justify-center">
        <ActivityIndicator size="large" color="#F20D0D" />
      </View>
    );
  }

  const confirmTitle =
    confirmType === "logout"
      ? t("profile.logoutConfirmTitle")
      : t("profile.deleteConfirmTitle");
  const confirmDescription =
    confirmType === "logout"
      ? t("profile.logoutConfirmText")
      : t("profile.deleteConfirmText");

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={["top"]}>
      <View className="px-4 flex-row items-center justify-between pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-11 h-11 rounded-full bg-white/10 items-center justify-center"
        >
          <ChevronLeft size={20} color="#FFF" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-medium">{t("profile.title")}</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          className="w-11 h-11 rounded-full bg-white/10 items-center justify-center"
        >
          <Pencil size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
        <View className="items-center mb-7">
          <Image
            source={{
              uri:
                profile?.avatar_url ??
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80",
            }}
            className="w-20 h-20 rounded-full mb-3"
          />
          <Text className="text-white text-2xl font-semibold">{profile?.full_name ?? "-"}</Text>
          <Text className="text-white/50 mt-1 text-sm">{profile?.phone ?? "-"}</Text>
        </View>

        <View className="gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                className="bg-[#2C2C2C] rounded-2xl px-3 py-3 flex-row items-center"
              >
                <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
                  <Icon size={18} color={item.isDanger ? "#FF4D4F" : "#D2D6DB"} />
                </View>

                <Text className={`flex-1 text-[15px] ${item.isDanger ? "text-[#FF4D4F]" : "text-white"}`}>
                  {item.title}
                </Text>

                {item.isToggle ? (
                  <Switch
                    value={pushEnabled}
                    onValueChange={setPushEnabled}
                    trackColor={{ false: "#3A3A3A", true: "#FF0000" }}
                    thumbColor="#fff"
                  />
                ) : (
                  <View className="flex-row items-center">
                    {item.value ? <Text className="text-white/55 mr-2">{item.value}</Text> : null}
                    {item.showChevron ? <ChevronRight size={18} color="#70757F" /> : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!confirmType} transparent animationType="fade" onRequestClose={() => setConfirmType(null)}>
        <View className="flex-1 bg-black/70 items-center justify-center px-5">
          <View className="w-full bg-[#3A3A3D] rounded-2xl p-4">
            <Text className="text-white text-3xl font-bold text-center">{confirmTitle}</Text>
            <Text className="text-white/55 text-center mt-3 mb-5 text-base">{confirmDescription}</Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setConfirmType(null)}
                className="flex-1 bg-[#5B5B5E] rounded-xl py-3"
                activeOpacity={0.8}
              >
                <Text className="text-white text-center font-semibold">{t("common.cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  const action = confirmType;
                  setConfirmType(null);
                  if (action === "logout") {
                    await logout();
                  } else {
                    await deleteAccount();
                  }
                  router.replace("/(auth)/login");
                }}
                className="flex-1 bg-[#FF0000] rounded-xl py-3"
                activeOpacity={0.8}
              >
                <Text className="text-white text-center font-semibold">
                  {confirmType === "logout" ? t("common.logout") : t("common.delete")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
