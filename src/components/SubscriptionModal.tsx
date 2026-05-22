import { memo, useCallback } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MessageCircle, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../store/selectors";
import { useTheme } from "../store/themeStore";
import { useI18n } from "../i18n";
import { SPACING, FONT_SIZE, BORDER_RADIUS } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function SubscriptionModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuthStore();

  const userTier = user?.tier ?? "tekin";
  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";

  const handleContact = useCallback(
    () => Linking.openURL("https://t.me/dilbek7011"),
    [],
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={overlayStyles.root}>
        <TouchableOpacity
          style={overlayStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            overlayStyles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, SPACING.lg),
            },
          ]}
        >
          <View
            style={[
              overlayStyles.header,
              { borderBottomColor: colors.border },
            ]}
          >
            <Text style={[overlayStyles.title, { color: colors.text }]}>
              {t("subscriptionDetails")}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{
              padding: SPACING.lg,
              paddingBottom: SPACING.xxl + 40,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {user && (
              <View
                style={[
                  overlayStyles.currentPlan,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[
                    overlayStyles.currentPlanLabel,
                    { color: colors.textTertiary },
                  ]}
                >
                  {t("currentPlan")}
                </Text>
                <View style={overlayStyles.currentPlanRow}>
                  <Text
                    style={[overlayStyles.currentPlanName, { color: colors.text }]}
                  >
                    {userTier === "pro"
                      ? t("planPro")
                      : userTier === "bor"
                        ? t("planBor")
                        : t("planFree")}
                  </Text>
                  {user?.subscriptionEndDate ? (
                    <Text
                      style={{
                        fontSize: FONT_SIZE.xs,
                        color: colors.textTertiary,
                      }}
                    >
                      {t("subscriptionEndDate")}:{" "}
                      {new Date(user.subscriptionEndDate).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}

            <View style={overlayStyles.cards}>
              <PlanCard
                title={t("planBor")}
                price={t("planBorPrice")}
                accentColor={colors.success}
                tier="bor"
                userTier={userTier}
                features={[
                  t("featureInventory"),
                  t("featureStatistics"),
                  t("featureSales"),
                  t("planBorDesc"),
                ]}
                showContact={userTier !== "bor"}
                onContact={handleContact}
                colors={colors}
                getT={t}
              />
              <PlanCard
                title={t("planPro")}
                price={t("planProPrice")}
                accentColor={colors.primary}
                tier="pro"
                userTier={userTier}
                features={[
                  t("featureInventory"),
                  t("featureStatistics"),
                  t("featureSales"),
                  t("featureUnlimited"),
                ]}
                showContact={userTier !== "pro" && !isSuperAdmin}
                showSuperBadge={isSuperAdmin}
                onContact={handleContact}
                colors={colors}
                getT={t}
              />
            </View>

            <View style={overlayStyles.support}>
              <Text
                style={[
                  overlayStyles.supportText,
                  { color: colors.textTertiary },
                ]}
              >
                {t("contactAdminSub")}
              </Text>
              <TouchableOpacity
                style={[
                  overlayStyles.contactBtn,
                  { backgroundColor: "#0088cc15", borderColor: "#0088cc40" },
                ]}
                onPress={handleContact}
                activeOpacity={0.7}
              >
                <MessageCircle size={16} color="#0088cc" />
                <Text style={[overlayStyles.contactBtnText, { color: "#0088cc" }]}>
                  Telegram: @dilbek7011
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const PlanCard = memo(function PlanCard({
  title,
  price,
  accentColor,
  tier,
  userTier,
  features,
  showContact,
  showSuperBadge,
  onContact,
  colors,
  getT,
}: {
  title: string;
  price: string;
  accentColor: string;
  tier: string;
  userTier: string;
  features: string[];
  showContact: boolean;
  showSuperBadge?: boolean;
  onContact: () => void;
  colors: any;
  getT: (key: string) => string;
}) {
  const isActive = userTier === tier;
  return (
    <View
      style={[
        overlayStyles.card,
        isActive && { borderColor: accentColor, borderWidth: 2 },
        { backgroundColor: colors.background },
      ]}
    >
      {isActive && (
        <View style={[overlayStyles.badge, { backgroundColor: accentColor }]}>
          <Text style={overlayStyles.badgeText}>
            {getT("currentPlanBadge")}
          </Text>
        </View>
      )}
      <Text style={[overlayStyles.planName, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[overlayStyles.planPrice, { color: accentColor }]}>
        {price}
      </Text>
      <View style={overlayStyles.features}>
        {features.map((f, i) => (
          <View key={i} style={overlayStyles.feature}>
            <Text style={[overlayStyles.featureDot, { color: accentColor }]}>✓</Text>
            <Text style={[overlayStyles.featureText, { color: colors.textSecondary }]}>
              {f}
            </Text>
          </View>
        ))}
      </View>
      {showContact && (
        <TouchableOpacity
          style={[
            overlayStyles.contactBtn,
            { backgroundColor: accentColor + "15", borderColor: accentColor + "40" },
          ]}
          onPress={onContact}
          activeOpacity={0.7}
        >
          <MessageCircle size={16} color={accentColor} />
          <Text style={[overlayStyles.contactBtnText, { color: accentColor }]}>
            {getT("contactAdmin")}
          </Text>
        </TouchableOpacity>
      )}
      {showSuperBadge && (
        <View
          style={[
            overlayStyles.contactBtn,
            { backgroundColor: colors.primary + "10" },
          ]}
        >
          <Text
            style={[overlayStyles.contactBtnText, { color: colors.primary }]}
          >
            {getT("cheksiz")}
          </Text>
        </View>
      )}
    </View>
  );
});

const overlayStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  title: { fontSize: FONT_SIZE.xl, fontWeight: "700" },
  currentPlan: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  currentPlanLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "500",
    marginBottom: 4,
  },
  currentPlanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentPlanName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
  cards: { gap: SPACING.md, marginBottom: SPACING.lg },
  card: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: "transparent",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: SPACING.md,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
  },
  planName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    marginBottom: 4,
  },
  planPrice: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    marginBottom: SPACING.md,
  },
  features: { gap: 6, marginBottom: SPACING.md },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureDot: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
  featureText: {
    fontSize: FONT_SIZE.sm,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  contactBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  support: { gap: SPACING.sm, paddingTop: SPACING.sm },
  supportText: {
    fontSize: FONT_SIZE.sm,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default memo(SubscriptionModal);
