import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { createStatisticsStyles } from "../styles";
import { useTheme } from "../../../store/themeStore";
import { useI18n } from "../../../i18n";
import { formatMoney } from "../../../utils/inventory";

type RankingItem = {
  id: string;
  name: string;
  sold: number;
  profit: number;
};

type Props = {
  title: string;
  subtitle?: string;
  items: RankingItem[];
  emptyText: string;
  limit?: number;
  variant?: "default" | "blacklist";
};

export function RankingCard({
  title,
  subtitle,
  items,
  emptyText,
  limit,
  variant = "default",
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStatisticsStyles(colors);
  const [showAll, setShowAll] = useState(false);

  const limited = limit && limit > 0 && items.length > limit && !showAll;
  const displayItems = limited ? items.slice(0, limit) : items;

  const isBlacklist = variant === "blacklist";

  return (
    <View style={[styles.card, isBlacklist && styles.cardBlacklist]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? (
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      ) : null}
      {displayItems.length ? (
        displayItems.map((item, index) => {
          const unsold = item.sold <= 0;
          const profitColor =
            item.profit < 0
              ? colors.danger
              : unsold
                ? colors.textTertiary
                : isBlacklist
                  ? colors.warning
                  : colors.secondary;

          return (
          <View key={item.id} style={styles.rankItem}>
            <View
              style={[
                styles.rankBadge,
                {
                  backgroundColor: isBlacklist
                    ? colors.danger + "22"
                    : index < 3
                      ? colors.secondary
                      : colors.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.rankBadgeText,
                  {
                    color: isBlacklist
                      ? colors.danger
                      : index < 3
                        ? colors.white
                        : colors.textSecondary,
                  },
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.rankMetrics}>
                <Text style={[styles.rankSub, unsold && { color: colors.textTertiary }]}>
                  {unsold ? t("notSoldInPeriod") : `${item.sold} dona`}
                </Text>
                <Text style={[styles.rankProfit, { color: profitColor }]}>
                  {formatMoney(item.profit)}
                </Text>
              </View>
            </View>
          </View>
          );
        })
      ) : (
        <Text style={styles.noDataText}>{emptyText}</Text>
      )}
      {limited || showAll ? (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.showMoreText}>
            {showAll ? t("showLess") : t("more")}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
