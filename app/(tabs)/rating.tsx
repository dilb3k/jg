import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  DateTimePickerAndroid,
  type AndroidNativeProps,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

import { apiClient } from "../../src/api/client";
import { BORDER_RADIUS, FONT_SIZE, SPACING, type ThemeColors } from "../../src/theme";
import { useRatingScreenStore } from "../../src/store/selectors";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import type { InventoryWithProduct } from "../../src/types";
import { getBusinessDate } from "../../src/utils/businessDay";
import { formatMoney, getInventoryMetrics } from "../../src/utils/inventory";

type SortType =
  | "profit_unit"
  | "profit_total"
  | "least_sold";

const SORT_LABELS: Record<SortType, string> = {
  profit_unit: "Birlik foyda",
  profit_total: "Jami foyda",
  least_sold: "Kam sotilgan",
};

export default function RatingScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { loadProducts, loadSnapshots, products, snapshots } = useRatingScreenStore();
  const [sortBy, setSortBy] = useState<SortType>("profit_total");
  const [filter, setFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [inventoryForDate, setInventoryForDate] = useState<InventoryWithProduct[]>([]);

  useEffect(() => {
    loadProducts();
    loadSnapshots();
  }, [loadProducts, loadSnapshots]);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const inventory = await apiClient.getInventory(
          selectedDate || getBusinessDate(),
        );
        setInventoryForDate(inventory);
      } catch {
        setInventoryForDate([]);
      }
    };

    loadInventory();
  }, [selectedDate, products.length]);

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
      ? snapshots.filter((snapshot) => snapshot.date === selectedDate)
      : snapshots;

    return relevantSnapshots.reduce<Record<string, { sold: number; profit: number }>>(
      (acc, snapshot) => {
        snapshot.items.forEach((item) => {
          const current = acc[item.productId] || { sold: 0, profit: 0 };
          current.sold += item.sold;
          current.profit += item.profit;
          acc[item.productId] = current;
        });

        return acc;
      },
      {},
    );
  }, [selectedDate, snapshots]);

  const rankingRows = useMemo(() => {
    let list = inventoryForDate
      .map((item) => {
        const metrics = getInventoryMetrics(item);
        return {
          ...item,
          sold: soldByProduct[item.productId]?.sold || 0,
          earnedProfit: soldByProduct[item.productId]?.profit || 0,
          stockValue: metrics.stockSellValue,
          remaining: metrics.remaining,
          marginPercent: metrics.marginPercent,
          potentialProfit: metrics.potentialProfit,
        };
      })
      .filter((item) =>
        item.product.name.toLowerCase().includes(filter.trim().toLowerCase()),
      );

    return [...list].sort((a, b) => {
      const profitUnitA = a.product.sellPrice - a.product.buyPrice;
      const profitUnitB = b.product.sellPrice - b.product.buyPrice;

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
  }, [filter, inventoryForDate, soldByProduct, sortBy]);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("search")}
          placeholderTextColor={colors.textTertiary}
          value={filter}
          onChangeText={setFilter}
        />

        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
            <Text style={styles.dateButtonLabel}>Sana</Text>
            <Text style={styles.dateButtonValue}>
              {selectedDate
                ? dayjs(selectedDate).format("DD MMM YYYY")
                : "All data"}
            </Text>
          </TouchableOpacity>

          {selectedDate ? (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setSelectedDate(null)}
            >
              <Text style={styles.resetButtonText}>All data</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.subtext}>
          {selectedDate
            ? `${dayjs(selectedDate).format("DD MMM YYYY")} kundagi reyting`
            : "Default holat: barcha ma'lumotlar bo'yicha reyting"}
        </Text>
      </View>

      <View style={styles.sortTabs}>
        {(Object.keys(SORT_LABELS) as SortType[]).map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[styles.sortTab, sortBy === sort ? styles.sortTabActive : null]}
            onPress={() => setSortBy(sort)}
          >
            <Text
              style={[
                styles.sortTabText,
                sortBy === sort ? styles.sortTabTextActive : null,
              ]}
            >
              {SORT_LABELS[sort]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={rankingRows}
        keyExtractor={(item) => item.localId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Reyting uchun ma&apos;lumot topilmadi</Text>
        }
        renderItem={({ item, index }) => {
          const profitPerUnit = item.product.sellPrice - item.product.buyPrice;
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
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <View
                    style={[
                      styles.marginBadge,
                      item.marginPercent >= 30 ? styles.marginBadgeGood : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.marginText,
                        item.marginPercent >= 30 ? styles.marginTextGood : null,
                      ]}
                    >
                      {item.marginPercent}%
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Qoldiq</Text>
                    <Text
                      style={[
                        styles.statValue,
                        item.remaining <= 5 ? styles.loss : null,
                      ]}
                    >
                      {item.remaining}
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Sotilgan</Text>
                    <Text style={[styles.statValue, item.sold > 0 ? styles.profit : null]}>
                      {item.sold}
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Birlik foyda</Text>
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
                    Olingan foyda: {formatMoney(item.earnedProfit)}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: { padding: SPACING.lg, paddingBottom: SPACING.sm },
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
  subtext: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
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
  sortTabText: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },
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
    flexShrink: 0,
  },
  rankText: { color: colors.white, fontWeight: "700", fontSize: FONT_SIZE.md },
  cardContent: { flex: 1 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
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
  marginText: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },
  marginTextGood: { color: colors.white, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },
  statValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: SPACING.sm,
    gap: 4,
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
