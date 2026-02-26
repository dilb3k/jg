import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "warning" | "info";

type ToastPayload = {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 2600;

const THEME: Record<ToastType, { bg: string; border: string; title: string }> = {
  success: { bg: "#12331E", border: "#27AE60", title: "#A6F4C5" },
  error: { bg: "#3A1719", border: "#FF4D4F", title: "#FFC9CA" },
  warning: { bg: "#392D16", border: "#F5A524", title: "#FFDCA3" },
  info: { bg: "#182538", border: "#4A90E2", title: "#C3DEFF" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<Required<Omit<ToastPayload, "duration">> | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    ({ message, title, type = "info", duration = DEFAULT_DURATION }: ToastPayload) => {
      if (!message.trim()) return;

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      setToast({
        message,
        title: title ?? "",
        type,
      });

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 210,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimerRef.current = setTimeout(hideToast, duration);
    },
    [hideToast, opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const palette = toast ? THEME[toast.type] : THEME.info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 12,
            right: 12,
            zIndex: 2000,
          }}
        >
          <Animated.View
            style={{
              opacity,
              transform: [{ translateY }],
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 12,
              backgroundColor: palette.bg,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            {toast.title ? (
              <Text style={{ color: palette.title, fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
                {toast.title}
              </Text>
            ) : null}
            <Text style={{ color: "#FFFFFF", fontSize: 13, lineHeight: 18 }}>{toast.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
