import { useTvLinkStore } from "@/store/tv-link.store";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CODE_LENGTH = 6;

export default function TvLinkCodeScreen() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const confirm = useTvLinkStore((s) => s.confirm);
  const confirming = useTvLinkStore((s) => s.confirming);

  const code = digits.join("");
  const isReady = code.length === CODE_LENGTH && !digits.includes("");

  // Auto-focus first input on mount
  useEffect(() => {
    const t = setTimeout(() => inputs.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (val: string, index: number) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    if (hasError) setHasError(false);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (hasError) setHasError(false);
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputs.current[index - 1]?.focus();
      }
    }
  };

  const handleConnect = async () => {
    if (!isReady || confirming) return;
    const ok = await confirm(code);
    if (ok) {
      router.back();
    } else {
      // Show error state in this screen — clear digits + shake
      setHasError(true);
      shake();
      setDigits(Array(CODE_LENGTH).fill(""));
      setTimeout(() => inputs.current[0]?.focus(), 50);
    }
  };

  const getBoxStyle = (index: number, digit: string) => {
    if (hasError) {
      return [styles.otpBox, styles.otpBoxError];
    }
    if (focusedIndex === index) {
      return [styles.otpBox, styles.otpBoxFocused];
    }
    if (digit) {
      return [styles.otpBox, styles.otpBoxFilled];
    }
    return [styles.otpBox];
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Код подключения</Text>
        <Text style={styles.subtitle}>Введите код с экрана TV</Text>

        {/* OTP boxes */}
        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputs.current[i] = ref; }}
              style={getBoxStyle(i, digit)}
              value={digit}
              onChangeText={(val) => handleChange(val, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          ))}
        </Animated.View>

        {/* Inline error message */}
        {hasError ? (
          <Text style={styles.errorText}>Неверный код. Проверьте код на экране TV.</Text>
        ) : null}
      </View>

      {/* Connect button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.connectBtn, isReady && !confirming ? styles.connectBtnActive : null]}
          activeOpacity={0.85}
          onPress={handleConnect}
          disabled={!isReady || confirming}
        >
          {confirming ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.connectBtnText}>Подключаем TV...</Text>
            </View>
          ) : (
            <Text style={styles.connectBtnText}>Подключить TV</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101010" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2C2C2C",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    marginBottom: 40,
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  otpBox: {
    width: 48,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    borderWidth: 1.5,
    borderColor: "#3A3A3A",
    color: "#fff",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    paddingTop: 0,
    paddingBottom: 0,
  },
  otpBoxFocused: {
    borderColor: "#FFFFFF",
    backgroundColor: "#2A2A2A",
  },
  otpBoxFilled: {
    borderColor: "#666",
    backgroundColor: "#2A2A2A",
  },
  otpBoxError: {
    borderColor: "#FF3B30",
    backgroundColor: "#2A1212",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  connectBtn: {
    backgroundColor: "#3A3A3A",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  connectBtnActive: {
    backgroundColor: "#FF0000",
  },
  connectBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
