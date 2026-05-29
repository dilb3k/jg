import { CameraView, useCameraPermissions } from "expo-camera";
import type { BarcodeType } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  X,
  Scan,
  Check,
  Camera,
  AlertTriangle,
  Zap,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react-native";

import { BORDER_RADIUS, FONT_SIZE, SPACING, type ThemeColors } from "../theme";

export type BarcodeConflict = {
  conflictName?: string;
  notFound?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onBarcodeDetected: (data: string) => void;
  colors: ThemeColors;
  message?: string;
  manualCapture?: boolean;
  conflictCheck?: (barcode: string, onResult: (conflict: BarcodeConflict | null) => void) => void;
};

const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code39", "code128"];

const BARCODE_TYPE_LABELS: Record<string, string> = {
  ean13: "EAN-13",
  ean8: "EAN-8",
  upc_a: "UPC-A",
  upc_e: "UPC-E",
  code39: "Code 39",
  code128: "Code 128",
};

export function BarcodeScannerModal({
  visible,
  onClose,
  onBarcodeDetected,
  colors,
  message,
  manualCapture,
  conflictCheck,
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scannedType, setScannedType] = useState<string | null>(null);
  const [conflict, setConflict] = useState<BarcodeConflict | null>(null);
  const [enableTorch, setEnableTorch] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [zoom, setZoom] = useState(0);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 1));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0));

  const commonBarcodeSettings = { barcodeTypes: BARCODE_TYPES as BarcodeType[] };

  const handleDetection = (data: string, type?: string) => {
    setScannedCode(data);
    setScannedType(type ?? null);
    setConflict(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (conflictCheck) {
      conflictCheck(data, (result) => {
        setConflict(result);
      });
    }
  };

  if (!permission) {
    return (
      <Modal transparent animationType="fade" onRequestClose={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal transparent animationType="fade" onRequestClose={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Scan size={40} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>
              Kamera ruxsati kerak
            </Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>
              Barcode skaner qilish uchun kamera ruxsatini bering
            </Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={styles.btnText}>Ruxsat berish</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.cancel, { color: colors.textSecondary }]}>
                Bekor qilish
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const typeLabel = scannedType ? BARCODE_TYPE_LABELS[scannedType] ?? scannedType.toUpperCase() : null;

  const topControls = (
    <View style={styles.topControls}>
      <TouchableOpacity style={styles.topBtn} onPress={onClose}>
        <X size={22} color="#ffffff" />
      </TouchableOpacity>
      <View style={styles.topRightControls}>
        <TouchableOpacity
          style={[styles.topBtn, enableTorch && { backgroundColor: colors.warning + "99" }]}
          onPress={() => setEnableTorch((prev) => !prev)}
        >
          <Zap size={20} color={enableTorch ? colors.warning : "#ffffff"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => setFacing((prev) => (prev === "back" ? "front" : "back"))}
        >
          <FlipHorizontal size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const zoomControls = (
    <View style={styles.zoomControls}>
      <TouchableOpacity
        style={[styles.zoomBtn, zoom <= 0 && { opacity: 0.3 }]}
        onPress={zoomOut}
        disabled={zoom <= 0}
      >
        <ZoomOut size={20} color="#ffffff" />
      </TouchableOpacity>
      <View style={styles.zoomTrack}>
        <View style={[styles.zoomFill, { width: `${zoom * 100}%`, backgroundColor: colors.primary }]} />
      </View>
      <TouchableOpacity
        style={[styles.zoomBtn, zoom >= 1 && { opacity: 0.3 }]}
        onPress={zoomIn}
        disabled={zoom >= 1}
      >
        <ZoomIn size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  if (manualCapture) {
    return (
      <Modal transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.wrapper}>
          <CameraView
            style={styles.camera}
            facing={facing}
            enableTorch={enableTorch}
            zoom={zoom}
            onBarcodeScanned={(result) => {
              const now = Date.now();
              const prev = lastScannedRef.current;
              if (prev && now - prev.time < 1000) return;
              if (result.data !== scannedCode) {
                lastScannedRef.current = { code: result.data, time: now };
                handleDetection(result.data, result.type);
              }
            }}
            barcodeScannerSettings={commonBarcodeSettings}
          >
            {topControls}

            <View style={styles.scanAreaManual}>
              <View style={styles.frameWrapper}>
                <View style={[styles.frame, { borderColor: colors.primary }]} />
                <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
                <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
                <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
                <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
              </View>
              {scannedCode ? (
                <View style={styles.codeDisplay}>
                  {typeLabel ? <Text style={styles.codeTypeLabel}>{typeLabel}</Text> : null}
                  <Text style={styles.codeDisplayValue}>{scannedCode}</Text>
                  {conflict ? (
                    <View style={[styles.manualBadge, { backgroundColor: colors.warning + "99" }]}>
                      <AlertTriangle size={16} color="#ffffff" />
                      <Text style={styles.manualBadgeText}>Bu code ro'yxatda o'tgan</Text>
                    </View>
                  ) : (
                    <View style={styles.manualBadge}>
                      <Check size={16} color="#ffffff" />
                      <Text style={styles.manualBadgeText}>Kod aniqlandi</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.hint}>
                  {message || "Barcode ni ramka ichiga joylashtiring"}
                </Text>
              )}
            </View>

            <View style={styles.bottomArea}>
              {zoomControls}
              <TouchableOpacity
                style={[
                  styles.captureBtn,
                  {
                    backgroundColor: scannedCode && !conflict ? colors.primary : "rgba(255,255,255,0.15)",
                    borderColor: scannedCode && !conflict ? colors.primary : "rgba(255,255,255,0.3)",
                  },
                ]}
                onPress={() => {
                  if (scannedCode && !conflict) {
                    onBarcodeDetected(scannedCode);
                  }
                }}
                activeOpacity={scannedCode && !conflict ? 0.8 : 1}
                disabled={!scannedCode || !!conflict}
              >
                <Camera size={22} color={scannedCode && !conflict ? "#ffffff" : "rgba(255,255,255,0.5)"} />
                <Text
                  style={[
                    styles.captureBtnText,
                    { color: scannedCode && !conflict ? "#ffffff" : "rgba(255,255,255,0.5)" },
                  ]}
                >
                  {scannedCode && !conflict ? "Barcode ni olish" : scannedCode ? "Barcode band" : "Skaner qilish"}
                </Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrapper}>
        <CameraView
          style={styles.camera}
          facing={facing}
          enableTorch={enableTorch}
          zoom={zoom}
          onBarcodeScanned={
            scannedCode
              ? undefined
              : (result) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleDetection(result.data, result.type);
                }
          }
          barcodeScannerSettings={commonBarcodeSettings}
        >
          <View style={styles.cameraUI}>
            {topControls}

            <View style={styles.scanArea}>
              {scannedCode ? (
                <View style={styles.codeCard}>
                  {conflict?.notFound ? (
                    <AlertTriangle size={22} color={colors.danger} />
                  ) : (
                    <Check size={22} color={colors.primary} />
                  )}
                  <Text style={styles.codeLabel}>
                    {conflict?.notFound ? "Bunday kod topilmadi" : "Aniqlangan kod"}
                  </Text>
                  {typeLabel ? <Text style={styles.codeTypeLabel}>{typeLabel}</Text> : null}
                  <Text style={[styles.codeValue, { color: conflict?.notFound ? colors.danger : colors.primary }]}>
                    {scannedCode}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.frameWrapper}>
                    <View style={[styles.frame, { borderColor: colors.primary }]} />
                    <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
                    <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
                    <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
                    <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
                  </View>
                  <Text style={styles.hint}>
                    {message || "Barcode ni ramka ichiga joylashtiring"}
                  </Text>
                </>
              )}
            </View>

            {scannedCode ? (
              <View style={styles.actionsFooter}>
                <TouchableOpacity
                  style={[styles.rescanBtn, conflict?.notFound && styles.rescanBtnFull]}
                  onPress={() => {
                    setScannedCode(null);
                    setConflict(null);
                  }}
                >
                  <RotateCw size={18} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text }]}>Qayta skaner</Text>
                </TouchableOpacity>
                {!conflict?.notFound ? (
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      onBarcodeDetected(scannedCode);
                      setScannedCode(null);
                    }}
                  >
                    <Check size={20} color="#ffffff" />
                    <Text style={[styles.actionText, { color: "#ffffff" }]}>Qabul qilish</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View style={styles.bottomArea}>
                {zoomControls}
              </View>
            )}
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  desc: {
    fontSize: FONT_SIZE.md,
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
  },
  btnText: { color: "#ffffff", fontSize: FONT_SIZE.md, fontWeight: "700" },
  cancel: { fontSize: FONT_SIZE.md, fontWeight: "600" },
  camera: { flex: 1 },
  cameraUI: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  topControls: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    zIndex: 10,
  },
  topRightControls: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  actionsFooter: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl + SPACING.xl,
    width: "100%",
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  zoomFill: {
    height: "100%",
    borderRadius: 2,
  },
  bottomArea: {
    alignItems: "center",
    gap: SPACING.md,
    paddingBottom: SPACING.xxl + SPACING.xl,
    width: "100%",
  },
  frameWrapper: {
    width: 280,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: "100%",
    height: "100%",
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    opacity: 0.6,
  },
  cornerTL: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BORDER_RADIUS.lg + 2,
  },
  cornerTR: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BORDER_RADIUS.lg + 2,
  },
  cornerBL: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BORDER_RADIUS.lg + 2,
  },
  cornerBR: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BORDER_RADIUS.lg + 2,
  },
  hint: {
    color: "#ffffff",
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    marginTop: SPACING.lg,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  codeCard: {
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    paddingTop: SPACING.lg + SPACING.sm,
    alignItems: "center",
    gap: SPACING.sm,
    marginHorizontal: SPACING.xl,
    minWidth: 260,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  codeLabel: {
    color: "#ffffff",
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    opacity: 0.8,
  },
  codeValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    width: "100%",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
  },
  actionText: { fontSize: FONT_SIZE.md, fontWeight: "700" },
  rescanBtn: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.xs,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  rescanBtnFull: {
    flex: 1,
    marginHorizontal: SPACING.lg,
  },
  scanAreaManual: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  codeDisplay: {
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  codeDisplayValue: {
    color: "#ffffff",
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    letterSpacing: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    overflow: "hidden",
  },
  codeTypeLabel: {
    color: "#ffffff",
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
    opacity: 0.6,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  manualBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  manualBadgeText: {
    color: "#ffffff",
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  captureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 16,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
  },
  captureBtnText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
});
