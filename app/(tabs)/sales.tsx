import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Minus, Plus, ShoppingBag } from "lucide-react-native";

import { SearchInputWithClear } from "../../src/components/SearchInputWithClear";
import {
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  type ThemeColors,
} from "../../src/theme";
import { useSalesScreenStore } from "../../src/store/selectors";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { getBusinessDate } from "../../src/utils/businessDay";
import { formatMoney } from "../../src/utils/inventory";
import type { InventoryWithProduct } from "../../src/types";

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
  const [localLoading, setLocalLoading] = useState(true);

  const reloadInventory = useCallback(async () => {
    setLocalLoading(true);
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
    if (!q) return sellable;
    return sellable.filter((row) =>
      row.product?.name?.toLowerCase().includes(q),
    );
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
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.localId}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
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
    list: { paddingHorizontal: SPACING.lg, paddingBottom: 160 },
    row: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "08",
    },
    rowMain: { marginBottom: SPACING.sm },
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
    },
    qtyBtn: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    qtyBtnDisabled: { opacity: 0.45 },
    qtyValue: {
      minWidth: 48,
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
      borderTopWidth: 1,
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
    confirmBtn: {
      backgroundColor: colors.primary,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmText: {
      color: colors.white,
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
  });
