import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import dayjs from "dayjs";

import { DatePickerModal } from "../../src/features/statistics/components/DatePickerModal";
import { OverallRangeCard } from "../../src/features/statistics/components/OverallRangeCard";
import { PeriodTabs, type PeriodType } from "../../src/features/statistics/components/PeriodTabs";
import {
  StatsSummaryCard,
  moneyStat,
} from "../../src/features/statistics/components/StatsSummaryCard";
import { RankingCard } from "../../src/features/statistics/components/RankingCard";
import { useStatisticsData } from "../../src/features/statistics/hooks/useStatisticsData";
import { createStatisticsStyles } from "../../src/features/statistics/styles";
import { useStatisticsScreenStore } from "../../src/store/selectors";
import { getBusinessDate } from "../../src/utils/businessDay";
import { formatMoney } from "../../src/utils/inventory";
import { useTheme } from "../../src/store/themeStore";

type PickerTarget = "period" | "overallStart" | "overallEnd";

const PERIOD_UNIT: Record<PeriodType, dayjs.ManipulateType> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);
  const {
    getStatistics,
    loadProducts,
    loadSnapshots,
    products,
    snapshots,
  } = useStatisticsScreenStore();

  const [period, setPeriod] = useState<PeriodType>("daily");
  const [selectedDate, setSelectedDate] = useState(() => getBusinessDate());
  const [overallStartDate, setOverallStartDate] = useState<string | null>(null);
  const [overallEndDate, setOverallEndDate] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [pickerDate, setPickerDate] = useState(() => getBusinessDate());

  useEffect(() => {
    loadProducts();
    loadSnapshots();
  }, [loadProducts, loadSnapshots]);

  const { overallRangeLabel, overallTotals, periodStats, topProducts } =
    useStatisticsData({
      getStatistics,
      products,
      snapshots,
      period,
      selectedDate,
      overallStartDate,
      overallEndDate,
    });

  const currentPeriodStats = useMemo(
    () => periodStats(period),
    [period, periodStats],
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
      pickerTarget === "overallStart" ? normalizedRange.end : normalizedRange.start;

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
      ? "Davr sanasini tanlang"
      : pickerTarget === "overallStart"
        ? "Boshlanish sanasini tanlang"
        : "Tugash sanasini tanlang";

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

  const marginPercent =
    currentPeriodStats.totalRevenue > 0
      ? Math.round(
          (currentPeriodStats.totalProfit / currentPeriodStats.totalRevenue) * 100,
        )
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PeriodTabs period={period} onChange={setPeriod} />
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => handleDateChange(-1)}>
          <Text style={styles.navButtonText}>{"<"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => openAndroidPicker("period")}
          activeOpacity={0.85}
        >
          <Text style={styles.dateText}>{periodLabel}</Text>
          <Text style={styles.dateHint}>Davr sanasini tanlash</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => handleDateChange(1)}>
          <Text style={styles.navButtonText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <StatsSummaryCard
          title="Jami tushum"
          items={[
            {
              label: "Asosiy KPI",
              value: formatMoney(currentPeriodStats.totalRevenue),
              highlight: true,
            },
            { label: "Sotilgan dona", value: currentPeriodStats.totalSoldItems },
            moneyStat("Sof foyda", currentPeriodStats.totalProfit, true),
            { label: "Marja", value: `${marginPercent}%`, highlight: true },
          ]}
          emptyText={
            currentPeriodStats.totalSoldItems === 0
              ? "Bu davrda hali savdo yo'q, shuning uchun qiymatlar 0 ko'rsatildi."
              : null
          }
        />

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

        <RankingCard
          title="Top mahsulotlar"
          items={topProducts}
          emptyText="Tanlangan davr bo'yicha mahsulot ma'lumoti yo'q"
        />

        <StatsSummaryCard
          title="Profit Insight"
          items={[
            moneyStat("Hozirgacha daromad", overallTotals.earnedProfit, true),
            moneyStat(
              "Qolgan potensial foyda",
              Math.max(overallTotals.possibleProfit - overallTotals.earnedProfit, 0),
            ),
            moneyStat(
              "Jami mumkin bo'lgan foyda",
              overallTotals.possibleProfit,
              true,
            ),
            {
              label: "Progress",
              value:
                overallTotals.possibleProfit > 0
                  ? `${Math.round((overallTotals.earnedProfit / overallTotals.possibleProfit) * 100)}%`
                  : "0%",
            },
          ]}
        />
      </ScrollView>

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
