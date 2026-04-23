import { Text, TouchableOpacity, View } from "react-native";

import { statisticsStyles as styles } from "../styles";

export type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

const PERIOD_LABELS: Record<PeriodType, string> = {
  daily: "Kun",
  weekly: "Hafta",
  monthly: "Oy",
  yearly: "Yil",
};

type Props = {
  period: PeriodType;
  onChange: (period: PeriodType) => void;
};

export function PeriodTabs({ period, onChange }: Props) {
  return (
    <View style={styles.periodTabs}>
      {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((value) => (
        <TouchableOpacity
          key={value}
          style={[styles.periodTab, period === value ? styles.periodTabActive : null]}
          onPress={() => onChange(value)}
        >
          <Text
            style={[
              styles.periodTabText,
              period === value ? styles.periodTabTextActive : null,
            ]}
          >
            {PERIOD_LABELS[value]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
