import { useTvLinkStore } from "@/store/tv-link.store";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ChevronLeft, Zap, ZapOff } from "lucide-react-native";
import { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TvLinkScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const confirm = useTvLinkStore((s) => s.confirm);
  const processingRef = useRef(false);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanned(true);

    try {
      const parsed = JSON.parse(data) as { type?: string; code?: string };
      if (parsed.type === "tv_auth" && parsed.code) {
        const ok = await confirm(parsed.code);
        if (ok) {
          router.back();
          return;
        }
      }
    } catch {
      // Not a valid JSON or not tv_auth
    }

    // Not a valid TV QR code — allow re-scan
    setTimeout(() => {
      setScanned(false);
      processingRef.current = false;
    }, 1500);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Загрузка...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer} edges={["top", "bottom"]}>
        <ChevronLeft
          size={24}
          color="#fff"
          onPress={() => router.back()}
          style={{ marginLeft: 16, marginBottom: 24 }}
        />
        <Text style={styles.permissionTitle}>Доступ к камере</Text>
        <Text style={styles.permissionText}>
          Разрешите доступ к камере для сканирования QR-кода с экрана телевизора
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={styles.permissionBtnText}>Разрешить</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Dark overlay with transparent center */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView edges={["top"]} style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Отсканируйте QR code</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        {/* Middle row: dark left, transparent center, dark right */}
        <View style={styles.middleRow}>
          <View style={styles.darkSide} />
          <View style={styles.scanArea}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {scanned ? (
              <View style={styles.scannedOverlay}>
                <Text style={styles.scannedText}>Обработка...</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.darkSide} />
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.torchBtn}
            onPress={() => setTorchOn((v) => !v)}
            activeOpacity={0.8}
          >
            {torchOn ? <ZapOff size={22} color="#fff" /> : <Zap size={22} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const SCAN_SIZE = 240;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  permissionContainer: { flex: 1, backgroundColor: "#101010", paddingTop: 16, paddingHorizontal: 24 },
  permissionTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  permissionText: { color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 22, marginBottom: 32 },
  permissionBtn: { backgroundColor: "#FF0000", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  permissionBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  overlay: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  middleRow: { flex: 1, flexDirection: "row" },
  darkSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  scanArea: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: "#fff",
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: "#fff",
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: "#fff",
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: "#fff",
    borderBottomRightRadius: 6,
  },

  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  scannedText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  bottomBar: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingBottom: 48,
    paddingTop: 24,
    alignItems: "center",
  },
  torchBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
