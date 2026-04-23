import dayjs from "dayjs";
import { Text, TouchableOpacity, View } from "react-native";

import { formatMoney } from "../../../utils/inventory";
import { statisticsStyles as styles } from "../styles";

type Props = {
  rangeLabel: string;
  overallStartDate: string | null;
  overallEndDate: string | null;
  onReset: () => void;
  onPickStart: () => void;
  onPickEnd: () => void;
  totals: {
    sellableItems: number;
    soldItems: number;
    sellableValue: number;
    earnedRevenue: number;
    possibleProfit: number;
    earnedProfit: number;
    remainingItems: number;
    stockValue: number;
  };
};

export function OverallRangeCard({
  rangeLabel,
  overallStartDate,
  overallEndDate,
  onReset,
  onPickStart,
  onPickEnd,
  totals,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Barcha vaqtdagi umumiy holat</Text>
          <Text style={styles.rangeLabel}>{rangeLabel}</Text>
        </View>
        {overallStartDate || overallEndDate ? (
          <TouchableOpacity onPress={onReset} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>All data</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.rangeActions}>
        <TouchableOpacity style={styles.rangeButton} onPress={onPickStart}>
          <Text style={styles.rangeButtonLabel}>Boshlanish</Text>
          <Text style={styles.rangeButtonValue}>
            {overallStartDate
              ? dayjs(overallStartDate).format("DD MMM YYYY")
              : "Boshidan"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.rangeButton} onPress={onPickEnd}>
          <Text style={styles.rangeButtonLabel}>Tugash</Text>
          <Text style={styles.rangeButtonValue}>
            {overallEndDate ? dayjs(overallEndDate).format("DD MMM YYYY") : "Hozirgacha"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <RangeStat label="Jami sotiladigan dona" value={totals.sellableItems} />
        <RangeStat label="Sotilgan dona" value={totals.soldItems} />
        <RangeStat
          label="Jami sotish qiymati"
          value={formatMoney(totals.sellableValue)}
        />
        <RangeStat
          label="Sotilgan qiymat"
          value={formatMoney(totals.earnedRevenue)}
        />
        <RangeStat
          label="Olinishi mumkin foyda"
          value={formatMoney(totals.possibleProfit)}
          highlight
        />
        <RangeStat
          label="Olingan foyda"
          value={formatMoney(totals.earnedProfit)}
          highlight
        />
        <RangeStat label="Qolgan dona" value={totals.remainingItems} />
        <RangeStat label="Qolgan qiymat" value={formatMoney(totals.stockValue)} />
      </View>
    </View>
  );
}

function RangeStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight ? styles.profit : null]}>{value}</Text>
    </View>
  );
}
