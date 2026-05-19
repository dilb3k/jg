import { Text, View } from "react-native";
import { useMemo } from "react";

import { formatMoney } from "../../../utils/inventory";
import { createStatisticsStyles } from "../styles";
import { useTheme } from "../../../store/themeStore";
import { useI18n } from "../../../i18n";

type Props = {
  rangeLabel: string;
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

export function OverallRangeCard({ rangeLabel, totals }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);

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

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>{t("ranging_overall")}</Text>
          <Text style={styles.rangeLabel}>{rangeLabel}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <RangeStat label={t("totalSellablePieces")} value={totals.sellableItems} />
        <RangeStat label={t("soldPieces")} value={totals.soldItems} />
        <RangeStat label={t("totalSellValue")} value={formatMoney(totals.sellableValue)} />
        <RangeStat label={t("soldValue")} value={formatMoney(totals.earnedRevenue)} />
        <RangeStat
          label={t("potentialProfit")}
          value={formatMoney(totals.possibleProfit)}
          highlight
        />
        <RangeStat
          label={t("earnedProfit")}
          value={formatMoney(totals.earnedProfit)}
          highlight
        />
        <RangeStat label={t("remainingPieces")} value={totals.remainingItems} />
        <RangeStat label={t("remainingStockValue")} value={formatMoney(totals.stockValue)} />
      </View>
    </View>
  );
}
