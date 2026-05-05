import { Text, View } from "react-native";
import { useMemo } from "react";

import { createStatisticsStyles } from "../styles";
import { useTheme } from "../../../store/themeStore";
import { useI18n } from "../../../i18n";

type RankingItem = {
  id: string;
  name: string;
  valueText: string;
};

type Props = {
  title: string;
  items: RankingItem[];
  emptyText: string;
};

export function RankingCard({ title, items, emptyText }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.length ? (
        items.map((item) => (
          <View key={item.id} style={styles.rankItem}>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.rankSub}>{item.valueText}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>{emptyText}</Text>
      )}
    </View>
  );
}
