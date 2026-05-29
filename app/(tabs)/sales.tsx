import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Minus, Package, Plus, Scan, ShoppingBag } from "lucide-react-native";
import { useFocusEffect } from "expo-router";

import { BarcodeScannerModal } from "../../src/components/BarcodeScannerModal";
import { SearchInputWithClear } from "../../src/components/SearchInputWithClear";
import {
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  type ThemeColors,
} from "../../src/theme";
import { useSalesScreenStore } from "../../src/store/selectors";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { getBusinessDate } from "../../src/utils/businessDay";
import { formatMoney } from "../../src/utils/inventory";
import type { InventoryWithProduct, Product } from "../../src/types";

export default function SalesScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    currentInventory,
    loadInventoryByDate,
    applySales,
    showToast,
    isLoading,
  } = useSalesScreenStore();

  const businessDate = getBusinessDate();
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(
    () => !currentInventory.some((row) => row.date === businessDate),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [barcodeQty, setBarcodeQty] = useState("1");
  const [showQtyModal, setShowQtyModal] = useState(false);
  const products = useStore((s) => s.products);

  const reloadInventory = useCallback(async () => {
    setLocalLoading(true);
    setQuantities({});
    try {
      await loadInventoryByDate(businessDate);
    } finally {
      setLocalLoading(false);
    }
  }, [businessDate, loadInventoryByDate]);

  useFocusEffect(
    useCallback(() => {
      void reloadInventory();
    }, [reloadInventory]),
  );

  useEffect(() => {
    setQuantities({});
  }, [currentInventory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInventoryByDate(businessDate);
    } finally {
      setRefreshing(false);
    }
  }, [businessDate, loadInventoryByDate]);

  const sellable = useMemo(
    () =>
      currentInventory.filter(
        (row) =>
          row.currentQuantity > 0 &&
          (row.date === businessDate || !row.date),
      ),
    [currentInventory, businessDate],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = sellable;
    if (q) {
      list = sellable.filter((row) =>
        row.product?.name?.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      const ia = a.product?.displayIndex ?? 0;
      const ib = b.product?.displayIndex ?? 0;
      return ia !== ib ? ia - ib : (a.product?.name ?? "").localeCompare(b.product?.name ?? "");
    });
  }, [sellable, search]);

  const setQty = useCallback((productId: string, next: number, max: number) => {
    const clamped = Math.min(Math.max(0, next), max);
    setQuantities((prev) => {
      if (clamped === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: clamped };
    });
  }, []);

  const totals = useMemo(() => {
    let revenue = 0;
    let pieces = 0;
    for (const row of sellable) {
      const qty = quantities[row.productId] ?? 0;
      if (qty <= 0) continue;
      revenue += qty * row.product.sellPrice;
      pieces += qty;
    }
    return { revenue, pieces };
  }, [sellable, quantities]);

  const handleBarcodeDetected = (data: string) => {
    const product = products.find((p) => p.barcodes?.includes(data));
    if (product) {
      setQuantities((prev) => ({
        ...prev,
        [product.localId]: (prev[product.localId] ?? 0) + 1,
      }));
      setShowBarcodeScanner(false);
      showToast(`${product.name} qo'shildi (+1)`, "success");
    } else {
      setShowBarcodeScanner(false);
      showToast("Barcode bo'yicha mahsulot topilmadi", "error");
    }
  };

  const handleBarcodeQtyConfirm = () => {
    if (!barcodeProduct) return;
    const qty = parseInt(barcodeQty, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast("Miqdorni to'g'ri kiriting", "error");
      return;
    }
    setQuantities((prev) => ({
      ...prev,
      [barcodeProduct.localId]: qty,
    }));
    setShowQtyModal(false);
    setBarcodeProduct(null);
    setBarcodeQty("1");
  };

  const handleConfirm = async () => {
    const lines = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (!lines.length) return;

    setIsSubmitting(true);
    try {
      await applySales(businessDate, lines);
      setQuantities({});
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t("saleCompleted"), "success");
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(err.message || t("error"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRow = ({ item }: { item: InventoryWithProduct }) => {
    const max = item.currentQuantity;
    const qty = quantities[item.productId] ?? 0;
    const lineTotal = qty * item.product.sellPrice;

    return (
      <View style={[styles.row, qty > 0 && styles.rowActive]}>
        <View style={styles.rowHeader}>
          <View style={styles.imgBox}>
            {item.product.image ? (
              <Image source={{ uri: item.product.image }} style={styles.img} />
            ) : (
              <View style={styles.noImgBox}>
                <Package size={22} color={colors.textTertiary} />
              </View>
            )}
          </View>
          <View style={styles.rowMain}>
            <Text style={styles.rowName} numberOfLines={2}>
              {item.product.name}
            </Text>
            <Text style={styles.rowMeta}>
              {formatMoney(item.product.sellPrice)} · {t("remaining")}: {max}
            </Text>
          </View>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, qty <= 0 && styles.qtyBtnDisabled]}
              onPress={() => setQty(item.productId, qty - 1, max)}
              disabled={qty <= 0}
            >
              <Minus size={20} color={qty > 0 ? colors.primary : colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.qtyValue}>
              <Text style={[styles.qtyText, qty > 0 && { color: colors.primary }]}>
                {qty}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.qtyBtn, qty >= max && styles.qtyBtnDisabled]}
              onPress={() => setQty(item.productId, qty + 1, max)}
              disabled={qty >= max}
              accessibilityLabel={t("add")}
            >
              <Plus size={20} color={qty < max ? colors.primary : colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
        {qty > 0 ? (
          <Text style={styles.lineTotal}>{formatMoney(lineTotal)}</Text>
        ) : null}
      </View>
    );
  };

  const loading = localLoading || isLoading;

  const hasSearchQuery = search.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <SearchInputWithClear
          colors={colors}
          placeholder={t("search")}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
        />
      </View>
      <Text style={styles.hint}>{t("salesHint")}</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.localId}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <ShoppingBag size={40} color={colors.textTertiary} />
              <Text style={styles.empty}>
                {hasSearchQuery ? t("noProductsFound") : t("noStock")}
              </Text>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, SPACING.lg) },
        ]}
      >
        <View style={styles.footerTotals}>
          <Text style={styles.footerLabel}>{t("saleTotal")}</Text>
          <Text style={styles.footerValue}>{formatMoney(totals.revenue)}</Text>
          {totals.pieces > 0 ? (
            <Text style={styles.footerSub}>
              {totals.pieces} {t("sold").toLowerCase()}
            </Text>
          ) : null}
        </View>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setQuantities({})}
          >
            <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => setShowBarcodeScanner(true)}
          >
            <Scan size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (totals.pieces === 0 || isSubmitting) && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={totals.pieces === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.confirmText}>{t("confirmSale")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showBarcodeScanner && (
        <BarcodeScannerModal
          visible
          onClose={() => setShowBarcodeScanner(false)}
          onBarcodeDetected={handleBarcodeDetected}
          colors={colors}
          message="Mahsulot barcode sini skaner qiling"
          conflictCheck={(barcode, onResult) => {
            const product = products.find((p) => p.barcodes?.includes(barcode));
            if (!product) {
              onResult({ notFound: true });
            } else {
              onResult(null);
            }
          }}
        />
      )}

      <Modal
        visible={showQtyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQtyModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.qtyOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.qtyCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.qtyTitle, { color: colors.text }]}>
              {barcodeProduct?.name}
            </Text>
            <Text style={[styles.qtyLabel, { color: colors.textSecondary }]}>
              Nechta sotmoqchisiz?
            </Text>
            <View style={styles.qtyInputRow}>
              <TouchableOpacity
                style={[styles.qtyAdjustBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setBarcodeQty((p) => String(Math.max(1, parseInt(p || "1", 10) - 1)))}
              >
                <Minus size={20} color={colors.text} />
              </TouchableOpacity>
              <TextInput
                style={[styles.qtyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
                value={barcodeQty}
                onChangeText={(v) => setBarcodeQty(v.replace(/\D/g, ""))}
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                style={[styles.qtyAdjustBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setBarcodeQty((p) => String(parseInt(p || "1", 10) + 1))}
              >
                <Plus size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.qtyActions}>
              <TouchableOpacity
                style={[styles.qtyCancelBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => { setShowQtyModal(false); setBarcodeProduct(null); }}
              >
                <Text style={[styles.qtyCancelText, { color: colors.text }]}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qtyConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleBarcodeQtyConfirm}
              >
                <Text style={styles.qtyConfirmText}>Savatga qo'shish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchHeader: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    hint: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.sm,
    },
    list: { paddingHorizontal: SPACING.lg, paddingBottom: 180 },
    row: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 0.5,
      borderColor: colors.border,
      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
      elevation: 2,
    },
    rowActive: {
      borderColor: colors.primary,
      borderWidth: 1,
      backgroundColor: colors.primary + "08",
    },
    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    imgBox: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.lg,
      overflow: "hidden",
      marginRight: SPACING.sm,
    },
    img: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.lg,
    },
    noImgBox: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    rowMain: { flex: 1 },
    rowName: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
      color: colors.text,
    },
    rowMeta: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    qtyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      flexShrink: 0,
      marginLeft: SPACING.sm,
    },
    qtyBtn: {
      width: 42,
      height: 42,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    qtyBtnDisabled: { opacity: 0.4 },
    qtyValue: {
      minWidth: 44,
      alignItems: "center",
    },
    qtyText: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: "800",
      color: colors.text,
    },
    lineTotal: {
      marginTop: SPACING.sm,
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.primary,
      textAlign: "right",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.xxxl,
    },
    empty: {
      marginTop: SPACING.md,
      color: colors.textTertiary,
      fontSize: FONT_SIZE.md,
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: SPACING.lg,
      paddingTop: SPACING.md,
      backgroundColor: colors.surface,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    footerTotals: { marginBottom: SPACING.md },
    footerLabel: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
    },
    footerValue: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: "800",
      color: colors.text,
    },
    footerSub: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    footerButtons: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.surfaceSecondary,
      paddingVertical: 14,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    cancelBtnText: {
      color: colors.text,
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
    },
    confirmBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
      boxShadow: "0px 4px 12px rgba(139, 92, 246, 0.3)",
      elevation: 3,
    },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmText: {
      color: colors.white,
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
    scanBtn: {
      width: 48,
      height: 48,
      backgroundColor: colors.secondary,
      borderRadius: BORDER_RADIUS.lg,
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0px 4px 12px rgba(16, 185, 129, 0.3)",
      elevation: 3,
    },
    qtyOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.xl,
    },
    qtyCard: {
      width: "100%",
      maxWidth: 340,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.xl,
      alignItems: "center",
    },
    qtyTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
      marginBottom: SPACING.xs,
      textAlign: "center",
    },
    qtyLabel: {
      fontSize: FONT_SIZE.md,
      marginBottom: SPACING.lg,
    },
    qtyInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      marginBottom: SPACING.xl,
    },
    qtyAdjustBtn: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.lg,
      justifyContent: "center",
      alignItems: "center",
    },
    qtyInput: {
      width: 80,
      textAlign: "center",
      fontSize: FONT_SIZE.xxl,
      fontWeight: "800",
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 0.5,
    },
    qtyActions: {
      flexDirection: "row",
      gap: SPACING.sm,
      width: "100%",
    },
    qtyCancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
    },
    qtyCancelText: {
      fontWeight: "600",
      fontSize: FONT_SIZE.md,
    },
    qtyConfirmBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
    },
    qtyConfirmText: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: FONT_SIZE.md,
    },
  });
