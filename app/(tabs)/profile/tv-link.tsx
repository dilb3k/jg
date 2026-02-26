import { useTvLinkStore } from "@/store/tv-link.store";
import { useRouter } from "expo-router";
import { ChevronLeft, Monitor, Smartphone, Tv, X } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

function DeviceIcon({ type }: { type: string }) {
  if (type === "tv") return <Tv size={18} color="#D2D6DB" />;
  if (type === "web") return <Monitor size={18} color="#D2D6DB" />;
  return <Smartphone size={18} color="#D2D6DB" />;
}

function formatLastActive(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function TvLinkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const devices = useTvLinkStore((s) => s.devices);
  const loadingDevices = useTvLinkStore((s) => s.loadingDevices);
  const confirmStatus = useTvLinkStore((s) => s.confirmStatus);
  const confirming = useTvLinkStore((s) => s.confirming);
  const fetchDevicesAction = useTvLinkStore((s) => s.fetchDevices);
  const removeDevice = useTvLinkStore((s) => s.removeDevice);
  const resetStatus = useTvLinkStore((s) => s.resetStatus);

  const toastAnim = useRef(new Animated.Value(-100)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void fetchDevicesAction();
  }, [fetchDevicesAction]);

  const showToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }).start(
        () => resetStatus(),
      );
    }, 3000);
  }, [toastAnim, resetStatus]);

  useEffect(() => {
    // Only show toast for success — errors are shown inline in the code/scan screens
    if (confirmStatus === "success") {
      showToast();
    }
  }, [confirmStatus, showToast]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const isSuccess = confirmStatus === "success";

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={["top"]}>
      {/* Toast */}
      {isSuccess ? (
        <Animated.View
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 16,
            right: 16,
            zIndex: 99,
            transform: [{ translateY: toastAnim }],
          }}
        >
          <View
            style={{
              backgroundColor: isSuccess ? "#1A3A2A" : "#3A1A1A",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: isSuccess ? "#2D6A4F" : "#6A2D2D",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isSuccess ? "#2D6A4F" : "#6A2D2D",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {isSuccess ? "✓" : "✕"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                {isSuccess ? "TV успешно подключён" : "Неверный код подключения"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 3 }}>
                {isSuccess
                  ? "Теперь вы можете смотреть фильмы и каналы на телевизоре"
                  : "Убедитесь что вы правильно ввели код подключения"}
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : null}

      {/* Header */}
      <View className="px-4 flex-row items-center pt-2 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-[#2C2C2C] items-center justify-center"
        >
          <ChevronLeft size={20} color="#fff" />
        </Pressable>
        <Text className="text-white text-lg font-medium flex-1 text-center mr-11">
          Подключение TV
        </Text>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View>
            {/* QR button */}
            <TouchableOpacity
              className="bg-white rounded-2xl py-4 items-center mb-3"
              activeOpacity={0.85}
              onPress={() => router.push("/profile/tv-link-scan")}
            >
              <Text className="text-[#101010] text-base font-semibold">Сканировать QR-код</Text>
            </TouchableOpacity>

            {/* Code button */}
            <TouchableOpacity
              style={{ backgroundColor: "#2C2C2C", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 28 }}
              activeOpacity={0.85}
              onPress={() => router.push("/profile/tv-link-code")}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                Подключить с помощью кода
              </Text>
            </TouchableOpacity>

            {/* Active devices section header */}
            <Text className="text-white text-base font-semibold mb-1">Активные устройства</Text>
            <Text className="text-white/45 text-sm mb-4" style={{ lineHeight: 18 }}>
              Здесь отображены все устройства, которые вы используете. Ненужные можно удалить.
            </Text>

            {loadingDevices && devices.length === 0 ? (
              <ActivityIndicator color="#FF0000" style={{ marginTop: 20 }} />
            ) : null}

            {confirming ? (
              <View className="items-center py-6">
                <ActivityIndicator size="large" color="#FF0000" />
                <Text className="text-white/60 mt-3">Подключаем TV...</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#1E1E1E",
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <DeviceIcon type={item.device_type} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                {item.device_name}
              </Text>
              {item.is_current ? (
                <Text style={{ color: "#4CAF50", fontSize: 12, marginTop: 2 }}>Это устройство</Text>
              ) : (
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
                  {formatLastActive(item.last_active_at)}
                </Text>
              )}
            </View>

            {!item.is_current ? (
              <TouchableOpacity
                onPress={() => void removeDevice(item.id)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#FF3B30",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.8}
              >
                <X size={14} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          !loadingDevices ? (
            <Text className="text-white/30 text-sm text-center mt-4">Нет активных устройств</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
