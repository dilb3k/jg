import { Text, View } from "react-native";
import { useMemo } from "react";

import { formatMoney } from "../../../utils/inventory";
import { createStatisticsStyles } from "../styles";
import { useTheme } from "../../../store/themeStore";

type Props = {
  title: string;
  items: {
    label: string;
    value: string | number;
    highlight?: boolean;
  }[];
  emptyText?: string | null;
};

export function StatsSummaryCard({ title, items, emptyText }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.statsGrid}>
        {items.map((item) => (
          <View key={item.label} style={styles.statItem}>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={[styles.statValue, item.highlight ? styles.profit : null]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
      {emptyText ? <Text style={styles.noDataText}>{emptyText}</Text> : null}
    </View>
  );
}

export const moneyStat = (
  label: string,
  value: number,
  highlight = false,
) => ({
  label,
  value: formatMoney(value),
  highlight,
});
