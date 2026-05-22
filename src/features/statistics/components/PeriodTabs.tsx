import { Text, TouchableOpacity, View } from "react-native";
import { useMemo } from "react";

import { createStatisticsStyles } from "../styles";
import { useTheme } from "../../../store/themeStore";
import { useI18n } from "../../../i18n";

export type PeriodType = "daily" | "monthly" | "yearly";

type Props = {
  period: PeriodType;
  onChange: (period: PeriodType) => void;
};

export function PeriodTabs({ period, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);
  const { t } = useI18n();
  const labels: Record<PeriodType, string> = {
    daily: t("daily"),
    monthly: t("monthly"),
    yearly: t("yearly"),
  };

  return (
    <View style={styles.periodTabs}>
      {(Object.keys(labels) as PeriodType[]).map((value) => (
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
            {labels[value]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
