import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

import { apiClient } from "../../src/api/client";
import {
  BORDER_RADIUS,
  FONT_SIZE,
  SPACING,
  type ThemeColors,
} from "../../src/theme";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import type { InventoryWithProduct } from "../../src/types";
import { getBusinessDate } from "../../src/utils/businessDay";
import { formatMoney, getInventoryMetrics } from "../../src/utils/inventory";

type SortType = "profit_unit" | "profit_total" | "least_sold";

type PickerTarget = "start" | "end";

export default function RatingScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [sortBy, setSortBy] = useState<SortType>("profit_total");
  const [filter, setFilter] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sortLabels = useMemo(
    () => ({
      profit_unit: t("profitPerUnit"),
      profit_total: t("totalProfitRating"),
      least_sold: t("leastSold"),
    }),
    [t],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { from?: string; to?: string } = {};
      if (startDate) params.from = startDate;
      if (endDate) params.to = endDate;

      const result = await apiClient.getInventoryWithProducts(params);
      setInventoryData(result.items);
    } catch {
      setInventoryData([]);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openPicker = (target: PickerTarget) => {
    const initialValue = target === "start"
      ? dayjs(startDate || getBusinessDate()).toDate()
      : dayjs(endDate || getBusinessDate()).toDate();

    DateTimePickerAndroid.open({
      value: initialValue,
      mode: "date",
      display: "default",
      onChange: (event, date) => {
        if (event.type !== "set" || !date) return;
        const formatted = dayjs(date).format("YYYY-MM-DD");
        if (target === "start") {
          setStartDate(endDate && formatted > endDate ? endDate : formatted);
          if (endDate && formatted > endDate) {
            setEndDate(formatted);
          }
        } else {
          setEndDate(startDate && formatted < startDate ? startDate : formatted);
          if (startDate && formatted < startDate) {
            setStartDate(formatted);
          }
        }
      },
    });
  };

  const rankingRows = useMemo(() => {
    let list = inventoryData.map((item) => {
      const metrics = getInventoryMetrics(item);
      return {
        localId: item.localId,
        productId: item.productId,
        name: item.product?.name || "Noma'lum",
        sellPrice: item.product?.sellPrice ?? 0,
        buyPrice: item.product?.buyPrice ?? 0,
        sold: metrics.sold,
        earnedProfit: metrics.realizedProfit,
        remaining: metrics.remaining,
        marginPercent: metrics.marginPercent,
      };
    });

    if (filter.trim()) {
      const term = filter.trim().toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(term));
    }

    return [...list].sort((a, b) => {
      const profitUnitA = a.sellPrice - a.buyPrice;
      const profitUnitB = b.sellPrice - b.buyPrice;

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
  }, [inventoryData, sortBy, filter]);

  const hasFilter = startDate || endDate;

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
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => openPicker("start")}
          >
            <Text style={styles.dateButtonLabel}>{t("start")}</Text>
            <Text style={styles.dateButtonValue}>
              {startDate
                ? dayjs(startDate).format("DD MMM YYYY")
                : t("from_beginning")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => openPicker("end")}
          >
            <Text style={styles.dateButtonLabel}>{t("end")}</Text>
            <Text style={styles.dateButtonValue}>
              {endDate
                ? dayjs(endDate).format("DD MMM YYYY")
                : t("until_now")}
            </Text>
          </TouchableOpacity>

          {hasFilter && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setStartDate(null);
                setEndDate(null);
              }}
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

      {isLoading && (
        <View style={styles.inventoryLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingTextSmall}>
            Ma&apos;lumotlar yangilanmoqda...
          </Text>
        </View>
      )}

      <FlatList
        data={rankingRows}
        keyExtractor={(item) => item.localId || item.productId || Math.random().toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isLoading ? "" : t("ratingNoData") || "Ma'lumot topilmadi"}
          </Text>
        }
        renderItem={({ item, index }) => {
          const profitPerUnit = item.sellPrice - item.buyPrice;

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
                      item.marginPercent >= 30 && styles.marginBadgeGood,
                    ]}
                  >
                    <Text
                      style={[
                        styles.marginText,
                        item.marginPercent >= 30 && styles.marginTextGood,
                      ]}
                    >
                      {Math.round(item.marginPercent)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>{t("remaining")}</Text>
                    <Text style={styles.statValue}>{item.remaining}</Text>
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
