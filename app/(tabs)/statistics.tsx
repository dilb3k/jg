import { useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { MessageCircle, RefreshCw, Download, CalendarClock } from "lucide-react-native";
import dayjs from "dayjs";

import { DatePickerModal } from "../../src/features/statistics/components/DatePickerModal";
import { OverallRangeCard } from "../../src/features/statistics/components/OverallRangeCard";
import { AllTimeStatisticsModal } from "../../src/features/statistics/components/AllTimeStatisticsModal";
import {
  PeriodTabs,
  type PeriodType,
} from "../../src/features/statistics/components/PeriodTabs";
import {
  StatsSummaryCard,
  moneyStat,
} from "../../src/features/statistics/components/StatsSummaryCard";
import { RankingCard } from "../../src/features/statistics/components/RankingCard";
import { useStatisticsData } from "../../src/features/statistics/hooks/useStatisticsData";
import { createStatisticsStyles } from "../../src/features/statistics/styles";
import { useStatisticsScreenStore, useAuthStore } from "../../src/store/selectors";
import { useStore } from "../../src/store";
import { apiClient, canReachServer } from "../../src/api/client";
import { getBusinessDate } from "../../src/utils/businessDay";
import { formatMoney } from "../../src/utils/inventory";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "../../src/theme";
import {
  buildStatisticsCsv,
  buildStatisticsProductRows,
  shareStatisticsFile,
} from "../../src/utils/statisticsExport";

const PERIOD_UNIT: Record<PeriodType, dayjs.ManipulateType> = {
  daily: "day",
  monthly: "month",
  yearly: "year",
};

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user, setUser } = useAuthStore();
  const snapshots = useStore((s) => s.snapshots);
  const showToast = useStore((s) => s.showToast);
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);
  const { getStatistics, products } = useStatisticsScreenStore();

  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
  const isPayed = isSuperAdmin || (user?.isPayed ?? false);

  const [period, setPeriod] = useState<PeriodType>("daily");
  const [selectedDate, setSelectedDate] = useState(() => getBusinessDate());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => getBusinessDate());
  const [showAllTimeModal, setShowAllTimeModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    overallTotals,
    currentPeriodStats,
    topProducts,
    leastProducts,
    inventoryItems,
    periodSnapshots,
    isLoading,
    fetchInventory,
  } = useStatisticsData({
      getStatistics,
      products,
      snapshots,
      period,
      selectedDate,
      isPayed,
    });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchInventory();
    } finally {
      setRefreshing(false);
    }
  }, [fetchInventory]);

  useFocusEffect(
    useCallback(() => {
      void fetchInventory();
    }, [fetchInventory]),
  );

  const earliestSnapshotDate = useMemo(() => {
    if (!snapshots.length) return null;
    return snapshots.reduce((earliest, snapshot) => {
      if (!earliest) return snapshot.date;
      return dayjs(snapshot.date).isBefore(dayjs(earliest)) ? snapshot.date : earliest;
    }, snapshots[0]?.date ?? null);
  }, [snapshots]);

  const latestSnapshotDate = useMemo(() => {
    if (!snapshots.length) return null;
    return snapshots.reduce((latest, snapshot) => {
      if (!latest) return snapshot.date;
      return dayjs(snapshot.date).isAfter(dayjs(latest)) ? snapshot.date : latest;
    }, snapshots[0]?.date ?? null);
  }, [snapshots]);

  const handleDateChange = (dir: number) => {
    setSelectedDate(
      dayjs(selectedDate).add(dir, PERIOD_UNIT[period]).format("YYYY-MM-DD"),
    );
  };

  const periodLabel = useMemo(() => {
    switch (period) {
      case "daily":
        return dayjs(selectedDate).format("DD MMMM YYYY");
      case "monthly":
        return dayjs(selectedDate).format("MMMM YYYY");
      case "yearly":
        return dayjs(selectedDate).format("YYYY");
    }
  }, [period, selectedDate]);

  const [refreshingUser, setRefreshingUser] = useState(false);

  const handleRefreshUser = async () => {
    setRefreshingUser(true);
    try {
      const me = await apiClient.getMe();
      setUser(me);
    } catch {
      // ignore
    } finally {
      setRefreshingUser(false);
    }
  };

  const handleRefreshStats = () => {
    void fetchInventory();
  };

  const marginPercent =
    currentPeriodStats.totalRevenue > 0
      ? Math.round(
          (currentPeriodStats.totalProfit / currentPeriodStats.totalRevenue) * 100,
        )
      : 0;

  const handleExport = async () => {
    const productRows = buildStatisticsProductRows(
      inventoryItems,
      periodSnapshots,
      products,
    );

    const payload = {
      periodLabel,
      productRows,
      dailyRows: [],
      labels: {
        title: t("statistics"),
        period: t("statisticsPeriod"),
        colNo: "№",
        colName: t("exportColProduct"),
        colBuy: t("exportColBuy"),
        colSell: t("exportColSell"),
        colJami: t("exportColJami"),
        colQoldi: t("exportColQoldi"),
        colSotildi: t("sold"),
        colCostSold: t("exportColCostSold"),
        colRevenue: t("exportColRevenue"),
        colNetProfit: t("exportColNetProfit"),
        colTurnover: t("exportColTurnover"),
        colCostTotal: t("exportColCostTotal"),
        colProfit: t("profit"),
        totalRow: t("exportTotal"),
        dailyTitle: t("exportDailyTitle"),
        colDate: t("date"),
        colDailySold: t("soldPieces"),
        colDailyProfit: t("netProfit"),
        colDailyTurnover: t("totalRevenueLabel"),
      },
    };
    try {
      const csv = buildStatisticsCsv(payload);
      const filePath = await shareStatisticsFile(csv, "hisvex-statistics", "csv");
      const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
      showToast(t("exportFileSaved", { fileName }), "success");
    } catch {
      showToast(t("exportFileError"), "error");
    }
  };

  if (!isPayed) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerFlex}>
          <PeriodTabs period={period} onChange={setPeriod} />
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefreshStats}
        >
          <RefreshCw size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginVertical: SPACING.sm, marginHorizontal: SPACING.lg, backgroundColor: colors.primary, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.sm }}>
        <TouchableOpacity style={{ width: 36, height: 36, justifyContent: "center", alignItems: "center" }} onPress={() => handleDateChange(-1)}>
          <Text style={{ fontSize: FONT_SIZE.lg, color: colors.white, fontWeight: "600" }}>{"<"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flex: 1, alignItems: "center", paddingVertical: SPACING.sm }}
          onPress={() => {
            setPickerDate(selectedDate);
            setShowPeriodPicker(true);
          }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: FONT_SIZE.md, fontWeight: "700", color: colors.white }}>{periodLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ width: 36, height: 36, justifyContent: "center", alignItems: "center" }} onPress={() => handleDateChange(1)}>
          <Text style={{ fontSize: FONT_SIZE.lg, color: colors.white, fontWeight: "600" }}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsToolbar}>
        <TouchableOpacity
          style={[styles.statsToolbarBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={handleExport}
        >
          <Download size={16} color={colors.primary} />
          <Text style={[styles.statsToolbarBtnText, { color: colors.text }]}>{t("downloadStatistics")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statsToolbarBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => setShowAllTimeModal(true)}
        >
          <CalendarClock size={16} color={colors.primary} />
          <Text style={[styles.statsToolbarBtnText, { color: colors.text }]}>{t("allTimeStatistics")}</Text>
        </TouchableOpacity>
      </View>

      {!canReachServer() && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>{t("offlineDateWarning")}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }>
          <StatsSummaryCard
            title={t("totalRevenueLabel")}
            items={[
              {
                label: "",
                value: formatMoney(currentPeriodStats.totalRevenue),
                highlight: true,
                isMain: true,
              },
              {
                label: t("soldPieces"),
                value: currentPeriodStats.totalSoldItems,
              },
              moneyStat(t("netProfit"), currentPeriodStats.totalProfit, true),
              {
                label: t("marginPercent"),
                value: `${marginPercent}%`,
                highlight: true,
              },
            ]}
            emptyText={
              currentPeriodStats.totalSoldItems === 0 ? t("noSalesPeriod") : null
            }
          />

          {overallTotals ? (
            <OverallRangeCard rangeLabel={periodLabel} totals={overallTotals} />
          ) : null}

          <RankingCard
            title={t("topProductsLabel")}
            items={topProducts}
            emptyText={t("noProductsPeriod")}
            limit={5}
          />

          {leastProducts.length > 0 ? (
            <RankingCard
              title={t("leastSold")}
              subtitle={t("blackListSubtitle")}
              items={leastProducts}
              emptyText={t("noProductsPeriod")}
              limit={5}
              variant="blacklist"
            />
          ) : null}
        </ScrollView>
      )}

      <DatePickerModal
        visible={showPeriodPicker}
        title={t("selectPeriodDate")}
        selectedDate={pickerDate}
        pickerMode={period === "daily" ? "day" : period === "monthly" ? "month" : "year"}
        onClose={() => setShowPeriodPicker(false)}
        onConfirm={(date) => {
          setPickerDate(date);
          setSelectedDate(date);
          setShowPeriodPicker(false);
        }}
      />

      <AllTimeStatisticsModal
        visible={showAllTimeModal}
        onClose={() => setShowAllTimeModal(false)}
        earliestDate={earliestSnapshotDate}
        latestDate={latestSnapshotDate}
      />
    </View>
  );
}
