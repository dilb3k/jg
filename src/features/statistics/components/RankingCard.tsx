import { Text, View } from "react-native";

import { statisticsStyles as styles } from "../styles";

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
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.length ? (
        items.map((item, index) => (
          <View key={item.id} style={styles.rankItem}>
            <Text style={styles.rankNum}>{index + 1}</Text>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName}>{item.name}</Text>
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
