import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import {
  DateTimePickerAndroid,
  type AndroidNativeProps,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

import { apiClient } from "../../src/api/client";
import {
  BORDER_RADIUS,
  FONT_SIZE,
  SPACING,
  type ThemeColors,
} from "../../src/theme";
import { useRatingScreenStore } from "../../src/store/selectors";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import type { InventoryEntry, InventoryWithProduct } from "../../src/types";
import { getBusinessDate } from "../../src/utils/businessDay";
import { formatMoney, getInventoryMetrics } from "../../src/utils/inventory";

type SortType = "profit_unit" | "profit_total" | "least_sold";

export default function RatingScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { snapshots } = useRatingScreenStore();

  const [sortBy, setSortBy] = useState<SortType>("profit_total");
  const [filter, setFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [inventoryForDate, setInventoryForDate] = useState<
    InventoryEntry[]
  >([]);

  const [isInventoryLoading, setIsInventoryLoading] = useState(false);

  const sortLabels = useMemo(
    () => ({
      profit_unit: t("profitPerUnit"),
      profit_total: t("totalProfitRating"),
      least_sold: t("leastSold"),
    }),
    [t],
  );

  // Load inventory for selected date
  useEffect(() => {
    const loadInventory = async () => {
      setIsInventoryLoading(true);
      try {
        const response = await apiClient.getInventory(
          selectedDate || getBusinessDate(),
        );

        // API javobi { success: true, data: { items: [...], summary: {...} } }
        let items: InventoryEntry[] = [];

        if (response && typeof response === "object") {
          if (Array.isArray(response)) {
            items = response;
          } else if (Array.isArray((response as any).items)) {
            items = (response as any).items;
          } else if (Array.isArray((response as any).data?.items)) {
            items = (response as any).data.items;
          }
        }

        setInventoryForDate(items);
      } catch (error) {
        console.error("Inventory load error:", error);
        setInventoryForDate([]);
      } finally {
        setIsInventoryLoading(false);
      }
    };

    loadInventory();
  }, [selectedDate]);

  const openDatePicker = () => {
    const params: AndroidNativeProps = {
      value: dayjs(selectedDate || getBusinessDate()).toDate(),
      mode: "date",
      display: "default",
      onChange: (event, date) => {
        if (event.type !== "set" || !date) return;
        setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
      },
    };

    DateTimePickerAndroid.open(params);
  };

  const soldByProduct = useMemo(() => {
    const relevantSnapshots = selectedDate
      ? snapshots.filter((s) => s.date === selectedDate)
      : snapshots;

    return relevantSnapshots.reduce<
      Record<string, { sold: number; profit: number }>
    >((acc, snapshot) => {
      snapshot.items.forEach((item) => {
        const pid = item.productId;
        if (!acc[pid]) acc[pid] = { sold: 0, profit: 0 };
        acc[pid].sold += item.sold || 0;
        acc[pid].profit += item.profit || 0;
      });
      return acc;
    }, {});
  }, [selectedDate, snapshots]);

  const rankingRows = useMemo(() => {
    const safeList = Array.isArray(inventoryForDate) ? inventoryForDate : [];

    let list = safeList.map((item) => {
      const metrics = getInventoryMetrics(item as any);
      const productId = item.productId || item.id || "";
      const product = (item as InventoryWithProduct).product;
      const name = product?.name || "Noma'lum";
      const sellPrice = product?.sellPrice ?? 0;
      const buyPrice = product?.buyPrice ?? 0;
      const quantity = product?.quantity ?? 0;

      return {
        ...item,
        name,
        sellPrice,
        buyPrice,
        quantity,
        sold: soldByProduct[productId]?.sold || 0,
        earnedProfit: soldByProduct[productId]?.profit || 0,
        remaining: metrics.remaining,
        marginPercent: metrics.marginPercent,
      };
    });

    // Filter
    if (filter.trim()) {
      const term = filter.trim().toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(term));
    }

    // Sort
    return [...list].sort((a, b) => {
      const profitUnitA = (a.sellPrice || 0) - (a.buyPrice || 0);
      const profitUnitB = (b.sellPrice || 0) - (b.buyPrice || 0);

      switch (sortBy) {
        case "profit_unit":
          return profitUnitB - profitUnitA;
        case "profit_total":
          return b.earnedProfit - a.earnedProfit;
        case "least_sold":
          return a.sold - b.sold;
        default:
          return 0;
      }
    });
  }, [inventoryForDate, soldByProduct, sortBy, filter]);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("search") || "Qidirish..."}
          placeholderTextColor={colors.textTertiary}
          value={filter}
          onChangeText={setFilter}
        />

        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
            <Text style={styles.dateButtonLabel}>{t("date")}</Text>
            <Text style={styles.dateButtonValue}>
              {selectedDate
                ? dayjs(selectedDate).format("DD MMM YYYY")
                : t("allTimeRating") || "Barcha vaqt"}
            </Text>
          </TouchableOpacity>

          {selectedDate && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setSelectedDate(null)}
            >
              <Text style={styles.resetButtonText}>{t("all_data")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.sortTabs}>
        {(Object.keys(sortLabels) as SortType[]).map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[styles.sortTab, sortBy === sort && styles.sortTabActive]}
            onPress={() => setSortBy(sort)}
          >
            <Text
              style={[
                styles.sortTabText,
                sortBy === sort && styles.sortTabTextActive,
              ]}
            >
              {sortLabels[sort]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isInventoryLoading && (
        <View style={styles.inventoryLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingTextSmall}>
            Ma&apos;lumotlar yangilanmoqda...
          </Text>
        </View>
      )}

      <FlatList
        data={rankingRows}
        keyExtractor={(item) =>
          item.localId || item.productId || item.id || Math.random().toString()
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isInventoryLoading
              ? ""
              : t("ratingNoData") || "Ma'lumot topilmadi"}
          </Text>
        }
        renderItem={({ item, index }) => {
          const profitPerUnit = (item.sellPrice || 0) - (item.buyPrice || 0);

          const rankColor =
            index === 0
              ? "#F59E0B"
              : index === 1
                ? "#94A3B8"
                : index === 2
                  ? "#B45309"
                  : colors.primary;

          return (
            <View style={styles.card}>
              <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View
                    style={[
                      styles.marginBadge,
                      (item.marginPercent || 0) >= 30 && styles.marginBadgeGood,
                    ]}
                  >
                    <Text
                      style={[
                        styles.marginText,
                        (item.marginPercent || 0) >= 30 &&
                          styles.marginTextGood,
                      ]}
                    >
                      {Math.round(item.marginPercent || 0)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>{t("remaining")}</Text>
                    <Text style={styles.statValue}>
                      {item.remaining ??
                        item.currentQuantity ??
                        item.quantity ??
                        0}
                    </Text>
                  </View>

                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>{t("sold")}</Text>
                    <Text
                      style={[styles.statValue, item.sold > 0 && styles.profit]}
                    >
                      {item.sold}
                    </Text>
                  </View>

                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>{t("profitPerUnit")}</Text>
                    <Text
                      style={[
                        styles.statValue,
                        profitPerUnit >= 0 ? styles.profit : styles.loss,
                      ]}
                    >
                      {formatMoney(profitPerUnit)}
                    </Text>
                  </View>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalText}>
                    {t("profitEarned")}: {formatMoney(item.earnedProfit)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

// Styles (o'zgartirishsiz)
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    inventoryLoading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.md,
      gap: SPACING.sm,
    },
    loadingText: {
      marginTop: SPACING.md,
      color: colors.textSecondary,
      fontSize: FONT_SIZE.md,
    },
    loadingTextSmall: {
      color: colors.textSecondary,
      fontSize: FONT_SIZE.sm,
    },
    filterRow: {
      padding: SPACING.lg,
      paddingBottom: SPACING.sm,
    },
    searchInput: {
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      fontSize: FONT_SIZE.md,
      color: colors.text,
    },
    dateRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    dateButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
    },
    dateButtonLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
    },
    dateButtonValue: {
      marginTop: 4,
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
      color: colors.text,
    },
    resetButton: {
      justifyContent: "center",
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.surfaceSecondary,
    },
    resetButtonText: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "700",
      color: colors.primary,
    },
    sortTabs: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.md,
      gap: SPACING.sm,
    },
    sortTab: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.full,
    },
    sortTabActive: { backgroundColor: colors.primary },
    sortTabText: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
    },
    sortTabTextActive: { color: colors.white, fontWeight: "700" },

    list: { padding: SPACING.lg, paddingTop: 0 },

    card: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
    },
    rankBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.md,
    },
    rankText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: FONT_SIZE.md,
    },
    cardContent: { flex: 1 },
    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    productName: {
      flex: 1,
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
    },
    marginBadge: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.surfaceSecondary,
    },
    marginBadgeGood: { backgroundColor: colors.secondary },
    marginText: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
    },
    marginTextGood: { color: colors.white, fontWeight: "700" },

    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    stat: { flex: 1, alignItems: "center" },
    statLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
    },
    statValue: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
      color: colors.text,
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: SPACING.sm,
    },
    totalText: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
    },
    profit: { color: colors.secondary },
    loss: { color: colors.danger },
    emptyText: {
      textAlign: "center",
      color: colors.textTertiary,
      marginTop: SPACING.xxxl,
    },
  });
