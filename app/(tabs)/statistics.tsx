import { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Lock, MessageCircle } from "lucide-react-native";
import dayjs from "dayjs";

import { DatePickerModal } from "../../src/features/statistics/components/DatePickerModal";
import { OverallRangeCard } from "../../src/features/statistics/components/OverallRangeCard";
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
import { getBusinessDate } from "../../src/utils/businessDay";
import { formatMoney } from "../../src/utils/inventory";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";

type PickerTarget = "period" | "overallStart" | "overallEnd";

const PERIOD_UNIT: Record<PeriodType, dayjs.ManipulateType> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};



export default function StatisticsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuthStore();
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);
  const { getStatistics, products, snapshots } =
    useStatisticsScreenStore();

  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
  const isPayed = isSuperAdmin || (user?.isPayed ?? false);

  const [period, setPeriod] = useState<PeriodType>("daily");
  const [selectedDate, setSelectedDate] = useState(() => getBusinessDate());
  const [overallStartDate, setOverallStartDate] = useState<string | null>(null);
  const [overallEndDate, setOverallEndDate] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [pickerDate, setPickerDate] = useState(() => getBusinessDate());

  const { overallRangeLabel, overallTotals, currentPeriodStats, topProducts, isLoading } =
    useStatisticsData({
      getStatistics,
      products,
      snapshots,
      period,
      selectedDate,
      overallStartDate,
      overallEndDate,
    });

  const earliestSnapshotDate = useMemo(() => {
    if (!snapshots.length) return null;

    return snapshots.reduce((earliest, snapshot) => {
      if (!earliest) return snapshot.date;
      return dayjs(snapshot.date).isBefore(dayjs(earliest))
        ? snapshot.date
        : earliest;
    }, snapshots[0]?.date ?? null);
  }, [snapshots]);

  const latestSnapshotDate = useMemo(() => {
    if (!snapshots.length) return null;

    return snapshots.reduce((latest, snapshot) => {
      if (!latest) return snapshot.date;
      return dayjs(snapshot.date).isAfter(dayjs(latest))
        ? snapshot.date
        : latest;
    }, snapshots[0]?.date ?? null);
  }, [snapshots]);

  const normalizedRange = useMemo(() => {
    if (!overallStartDate && !overallEndDate) {
      return { start: null, end: null };
    }

    if (!overallStartDate) {
      return { start: overallEndDate, end: overallEndDate };
    }

    if (!overallEndDate) {
      return { start: overallStartDate, end: overallStartDate };
    }

    return dayjs(overallStartDate).isBefore(dayjs(overallEndDate))
      ? { start: overallStartDate, end: overallEndDate }
      : { start: overallEndDate, end: overallStartDate };
  }, [overallEndDate, overallStartDate]);

  const openAndroidPicker = (target: PickerTarget) => {
    const initialValue =
      target === "period"
        ? selectedDate
        : target === "overallStart"
          ? normalizedRange.start || earliestSnapshotDate || selectedDate
          : normalizedRange.end || latestSnapshotDate || getBusinessDate();

    setPickerTarget(target);
    setPickerDate(initialValue);
  };

  const closePickerModal = () => {
    setPickerTarget(null);
  };

  const handlePickerSave = (nextDate?: string) => {
    if (!pickerTarget) return;

    const pickedDate = nextDate || pickerDate;

    if (pickerTarget === "period") {
      setSelectedDate(pickedDate);
      closePickerModal();
      return;
    }

    const otherDate =
      pickerTarget === "overallStart"
        ? normalizedRange.end
        : normalizedRange.start;

    if (!otherDate) {
      if (pickerTarget === "overallStart") {
        setOverallStartDate(pickedDate);
      } else {
        setOverallEndDate(pickedDate);
      }
      closePickerModal();
      return;
    }

    const [startDate, endDate] = [pickedDate, otherDate].sort(
      (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf(),
    );

    setOverallStartDate(startDate);
    setOverallEndDate(endDate);
    closePickerModal();
  };

  const pickerTitle =
    pickerTarget === "period"
      ? t("selectPeriodDate")
      : pickerTarget === "overallStart"
        ? t("selectStartDate")
        : t("selectEndDate");

  const handleDateChange = (dir: number) => {
    setSelectedDate(
      dayjs(selectedDate).add(dir, PERIOD_UNIT[period]).format("YYYY-MM-DD"),
    );
  };

  const periodLabel = useMemo(() => {
    switch (period) {
      case "daily":
        return dayjs(selectedDate).format("DD MMMM YYYY");
      case "weekly":
        return `${dayjs(selectedDate).startOf("week").format("DD MMM")} - ${dayjs(selectedDate).endOf("week").format("DD MMM YYYY")}`;
      case "monthly":
        return dayjs(selectedDate).format("MMMM YYYY");
      case "yearly":
        return dayjs(selectedDate).format("YYYY");
    }
  }, [period, selectedDate]);

  const { isServerReachable } = useNetworkStatus();

  const marginPercent =
    currentPeriodStats.totalRevenue > 0
      ? Math.round(
          (currentPeriodStats.totalProfit / currentPeriodStats.totalRevenue) *
            100,
        )
      : 0;

  if (!isPayed) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <PeriodTabs period={period} onChange={setPeriod} />
        </View>
        <View style={styles.lockedContainer}>
          <View style={[styles.lockedIconContainer, { backgroundColor: colors.primary + "15" }]}>
            <Lock size={48} color={colors.primary} />
          </View>
          <Text style={[styles.lockedTitle, { color: colors.text }]}>
            {t("paymentRequired")}
          </Text>
          <Text style={[styles.lockedMessage, { color: colors.textSecondary }]}>
            {t("paymentRequiredMessage")}
          </Text>
          <TouchableOpacity
            style={[styles.telegramButton, { backgroundColor: "#0088cc" }]}
            onPress={() => Linking.openURL("https://t.me/dilbek7011")}
          >
            <MessageCircle size={20} color="#ffffff" />
            <Text style={styles.telegramButtonText}>Telegram: @dilbek7011</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PeriodTabs period={period} onChange={setPeriod} />
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleDateChange(-1)}
        >
          <Text style={styles.navButtonText}>{"<"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => openAndroidPicker("period")}
          activeOpacity={0.85}
        >
          <Text style={styles.dateText}>{periodLabel}</Text>
          <Text style={styles.dateHint}>{t("selectDateHint")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleDateChange(1)}
        >
          <Text style={styles.navButtonText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {!isServerReachable && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>{t("offlineDateWarning")}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

          {overallTotals && (
            <>
              <OverallRangeCard
                rangeLabel={overallRangeLabel}
                overallStartDate={overallStartDate}
                overallEndDate={overallEndDate}
                onReset={() => {
                  setOverallStartDate(null);
                  setOverallEndDate(null);
                }}
                onPickStart={() => openAndroidPicker("overallStart")}
                onPickEnd={() => openAndroidPicker("overallEnd")}
                totals={overallTotals}
              />

              <StatsSummaryCard
                title={t("profitInsight")}
                items={[
                  moneyStat(t("earningsSoFar"), overallTotals.earnedProfit, true),
                  moneyStat(
                    t("remainingPotentialProfit"),
                    Math.max(
                      overallTotals.possibleProfit - overallTotals.earnedProfit,
                      0,
                    ),
                  ),
                  moneyStat(t("totalPotential"), overallTotals.possibleProfit, true),
                  {
                    label: t("progress"),
                    value:
                      overallTotals.possibleProfit > 0
                        ? `${Math.round((overallTotals.earnedProfit / overallTotals.possibleProfit) * 100)}%`
                        : "0%",
                  },
                ]}
              />
            </>
          )}

          <RankingCard
            title={t("topProductsLabel")}
            items={topProducts}
            emptyText={t("noProductsPeriod")}
          />
        </ScrollView>
      )}

      <DatePickerModal
        visible={!!pickerTarget}
        title={pickerTitle}
        selectedDate={pickerDate}
        onClose={closePickerModal}
        onConfirm={(date) => {
          setPickerDate(date);
          handlePickerSave(date);
        }}
      />
    </View>
  );
}
