import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";
import { X } from "lucide-react-native";

import { formatMoney, getInventoryTotals } from "../../../utils/inventory";
import { createStatisticsStyles } from "../styles";
import { useStore } from "../../../store";
import { useTheme } from "../../../store/themeStore";
import { useI18n } from "../../../i18n";
import { DatePickerModal } from "./DatePickerModal";

type PickerTarget = "from" | "to" | null;

type Props = {
  visible: boolean;
  onClose: () => void;
  earliestDate: string | null;
  latestDate: string | null;
};

export function AllTimeStatisticsModal({
  visible,
  onClose,
  earliestDate,
  latestDate,
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);

  const [fromDate, setFromDate] = useState(() =>
    earliestDate || dayjs().subtract(1, "year").format("YYYY-MM-DD"),
  );
  const [toDate, setToDate] = useState(() => latestDate || dayjs().format("YYYY-MM-DD"));
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerDate, setPickerDate] = useState(fromDate);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState<{
    sellableItems: number;
    soldItems: number;
    sellableValue: number;
    earnedRevenue: number;
    possibleProfit: number;
    earnedProfit: number;
    remainingItems: number;
    stockValue: number;
  } | null>(null);

  const normalized = useMemo(() => {
    const a = dayjs(fromDate);
    const b = dayjs(toDate);
    return a.isBefore(b) || a.isSame(b, "day")
      ? { from: fromDate, to: toDate }
      : { from: toDate, to: fromDate };
  }, [fromDate, toDate]);

  const fetchForRange = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      await useStore.getState().loadInventoryRange(from, to);
      const cacheKey = `${from}_${to}`;
      const cached = useStore.getState().inventoryRangeCache[cacheKey];
      const result = cached ?? { items: [], summary: undefined };
      const s = result.summary;
      if (s) {
        setTotals({
          sellableItems: s.totalSold + s.totalCurrent,
          soldItems: s.totalSold,
          sellableValue: s.totalRevenue + s.totalStockSellValue,
          earnedRevenue: s.totalRevenue,
          possibleProfit: s.totalProfit + s.totalStockProfit,
          earnedProfit: s.totalProfit,
          remainingItems: s.totalCurrent,
          stockValue: s.totalStockSellValue,
        });
      } else {
        const items = result.items ?? [];
        const inv = getInventoryTotals(items, null);
        setTotals({
          sellableItems: inv.sold + inv.current,
          soldItems: inv.sold,
          sellableValue: inv.revenue + inv.stockSellValue,
          earnedRevenue: inv.revenue,
          possibleProfit: inv.profit + inv.stockProfit,
          earnedProfit: inv.profit,
          remainingItems: inv.current,
          stockValue: inv.stockSellValue,
        });
      }
    } catch {
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const from = earliestDate || dayjs().subtract(1, "year").format("YYYY-MM-DD");
    const to = latestDate || dayjs().format("YYYY-MM-DD");
    setFromDate(from);
    setToDate(to);
    const a = dayjs(from);
    const b = dayjs(to);
    const range =
      a.isBefore(b) || a.isSame(b, "day") ? { from, to } : { from: to, to: from };
    fetchForRange(range.from, range.to);
  }, [visible, earliestDate, latestDate, fetchForRange]);

  const openPicker = (target: "from" | "to") => {
    setPickerTarget(target);
    setPickerDate(target === "from" ? normalized.from : normalized.to);
  };

  const Stat = ({
    label,
    value,
    highlight,
  }: {
    label: string;
    value: string | number;
    highlight?: boolean;
  }) => (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight ? styles.profit : null]}>{value}</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.allTimeModalRoot,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={[styles.allTimeHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.allTimeTitle, { color: colors.text }]}>
            {t("allTimeStatisticsTitle")}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.allTimeClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.allTimeRangeRow}>
          <TouchableOpacity style={styles.rangeButton} onPress={() => openPicker("from")}>
            <Text style={styles.rangeButtonLabel}>{t("rangeFrom")}</Text>
            <Text style={styles.rangeButtonValue}>
              {dayjs(normalized.from).format("DD MMM YYYY")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rangeButton} onPress={() => openPicker("to")}>
            <Text style={styles.rangeButtonLabel}>{t("rangeTo")}</Text>
            <Text style={styles.rangeButtonValue}>
              {dayjs(normalized.to).format("DD MMM YYYY")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.applyRangeBtn, { backgroundColor: colors.primary }]}
          onPress={() => fetchForRange(normalized.from, normalized.to)}
          disabled={loading}
        >
          <Text style={[styles.applyRangeBtnText, { color: colors.white }]}>
            {t("applyRange")}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t("loading")}</Text>
          </View>
        ) : totals ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <View style={styles.statsGrid}>
              <Stat label={t("totalSellablePieces")} value={totals.sellableItems} />
              <Stat label={t("soldPieces")} value={totals.soldItems} />
              <Stat label={t("totalSellValue")} value={formatMoney(totals.sellableValue)} />
              <Stat label={t("soldValue")} value={formatMoney(totals.earnedRevenue)} />
              <Stat
                label={t("potentialProfit")}
                value={formatMoney(totals.possibleProfit)}
                highlight
              />
              <Stat
                label={t("earnedProfit")}
                value={formatMoney(totals.earnedProfit)}
                highlight
              />
              <Stat label={t("remainingPieces")} value={totals.remainingItems} />
              <Stat label={t("remainingStockValue")} value={formatMoney(totals.stockValue)} />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t("noData")}
            </Text>
          </View>
        )}

        <DatePickerModal
          visible={!!pickerTarget}
          title={pickerTarget === "from" ? t("selectStartDate") : t("selectEndDate")}
          selectedDate={pickerDate}
          onClose={() => setPickerTarget(null)}
          onConfirm={(date) => {
            setPickerDate(date);
            if (pickerTarget === "from") setFromDate(date);
            else if (pickerTarget === "to") setToDate(date);
            setPickerTarget(null);
          }}
        />
      </View>
    </Modal>
  );
}
