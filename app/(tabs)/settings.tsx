import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Globe,
  Moon,
  Sun,
  User,
  LogOut,
  MessageCircle,
  Info,
  ChevronRight,
  Lock,
  PenSquare,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";

import { useAuthStore } from "../../src/store/selectors";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { useStore } from "../../src/store";
import SubscriptionModal from "../../src/components/SubscriptionModal";
import {
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  type ThemeColors,
} from "../../src/theme";
import {
  getBusinessDayStartHour,
  getPendingBusinessDayStartHour,
  getEffectiveFrom,
} from "../../src/utils/businessDay";

const THEMES = [
  { code: "light", labelKey: "light", icon: Sun },
  { code: "dark", labelKey: "dark", icon: Moon },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, logout } = useAuthStore();
  const { theme, setTheme, language, setLanguage } = useTheme();
  const userTier = user?.tier ?? "tekin";
  const setBusinessDayHour = useStore((state) => state.setBusinessDayHour);
  const blockCode = useStore((state) => state.blockCode);
  const setBlockCode = useStore((state) => state.setBlockCode);
  const showToast = useStore((state) => state.showToast);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showBusinessDayModal, setShowBusinessDayModal] = useState(false);
  const [editingHour, setEditingHour] = useState(() => getBusinessDayStartHour());
  const [confirmStep, setConfirmStep] = useState(false);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockInput, setBlockInput] = useState("");
  const [blockInputConfirm, setBlockInputConfirm] = useState("");
  const [blockError, setBlockError] = useState("");

  const [showBlockVerify, setShowBlockVerify] = useState(false);
  const [blockVerifyInput, setBlockVerifyInput] = useState("");
  const [blockVerifyError, setBlockVerifyError] = useState("");

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const updateProfile = useStore((state) => state.updateProfile);

  const openBlockModal = () => {
    setBlockInput("");
    setBlockInputConfirm("");
    setBlockError("");
    setShowBlockModal(true);
  };

  const openBlockWithVerify = () => {
    if (blockCode) {
      setBlockVerifyInput("");
      setBlockVerifyError("");
      setShowBlockVerify(true);
    } else {
      openBlockModal();
    }
  };

  const handleVerifyBlockCode = () => {
    if (blockVerifyInput === blockCode) {
      setShowBlockVerify(false);
      setBlockVerifyInput("");
      setBlockVerifyError("");
      openBlockModal();
    } else {
      setBlockVerifyError(t("blockCodeWrong"));
      setBlockVerifyInput("");
    }
  };

  const handleSaveBlockCode = async () => {
    if (blockInput.length !== 4 || !/^\d{4}$/.test(blockInput)) {
      setBlockError(t("enter4DigitCode"));
      return;
    }
    if (!blockCode && blockInput !== blockInputConfirm) {
      setBlockError(t("codesDoNotMatch"));
      return;
    }
    const wasSet = !!blockCode;
    await setBlockCode(blockInput);
    setShowBlockModal(false);
    showToast(wasSet ? t("blockCodeChanged") : t("blockCodeSet"), "success");
  };

  const handleRemoveBlockCode = async () => {
    await setBlockCode(null);
    setShowBlockModal(false);
    showToast(t("blockCodeRemoved"), "success");
  };

  const LANGUAGES = [
    { code: "uz", label: t("lang_uz") },
    { code: "ru", label: t("lang_ru") },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLanguageChange = (code: "uz" | "ru") => {
    setLanguage(code);
  };

  const getThemeLabel = (key: string) =>
    key === "light" ? t("light") : t("dark");

  const openBusinessDayModal = () => {
    setEditingHour(getBusinessDayStartHour());
    setConfirmStep(false);
    setShowBusinessDayModal(true);
  };

  const handleBusinessDayDec = () => {
    setEditingHour((prev) => (prev <= 0 ? 23 : prev - 1));
  };

  const handleBusinessDayInc = () => {
    setEditingHour((prev) => (prev >= 23 ? 0 : prev + 1));
  };

  const handleBusinessDaySave = () => {
    setConfirmStep(true);
  };

  const confirmBusinessDayChange = () => {
    setBusinessDayHour(editingHour);
    setShowBusinessDayModal(false);
    setConfirmStep(false);
  };

  const cancelBusinessDayChange = () => {
    setShowBusinessDayModal(false);
    setConfirmStep(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile */}
        {user && (
          <View style={styles.section}>
            <Pressable
            style={styles.userCard}
            onPress={() => {
              setProfileUsername(user.username);
              setProfilePhone(user.phone_number ?? "");
              setShowProfileModal(true);
            }}
          >
              <View
                style={[
                  styles.userAvatarWrap,
                  {
                    backgroundColor:
                      userTier === "pro"
                        ? colors.primary + "20"
                        : userTier === "bor"
                          ? colors.success + "20"
                          : colors.textTertiary + "15",
                    borderColor:
                      userTier === "pro"
                        ? colors.primary + "40"
                        : userTier === "bor"
                          ? colors.success + "40"
                          : colors.border,
                  },
                ]}
              >
                <User
                  size={28}
                  color={
                    userTier === "pro"
                      ? colors.primary
                      : userTier === "bor"
                        ? colors.success
                        : colors.textSecondary
                  }
                />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.username}</Text>
                <Text style={styles.userRole}>
                  {user.role?.toLowerCase() === "superadmin"
                    ? t("superAdmin")
                    : t("admin")}
                </Text>
              </View>
              <View style={[styles.settingCardIcon, { backgroundColor: colors.primary + "12" }]}>
                <PenSquare size={18} color={colors.primary} />
              </View>
            </Pressable>

            {/* Subscription Card */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSubscriptionModal(true)}
              style={[
                styles.subCard,
                {
                  backgroundColor:
                    userTier === "pro"
                      ? colors.primary + "12"
                      : userTier === "bor"
                        ? colors.success + "12"
                        : colors.surface,
                  borderColor:
                    userTier === "pro"
                      ? colors.primary + "30"
                      : userTier === "bor"
                        ? colors.success + "30"
                        : colors.border,
                },
              ]}
            >
              <View style={styles.subCardRow}>
                <View style={styles.subBadgeWrap}>
                  <View
                    style={[
                      styles.subBadge,
                      {
                        backgroundColor:
                          userTier === "pro"
                            ? colors.primary + "20"
                            : userTier === "bor"
                              ? colors.success + "20"
                              : colors.textTertiary + "15",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subBadgeText,
                        {
                          color:
                            userTier === "pro"
                              ? colors.primary
                              : userTier === "bor"
                                ? colors.success
                                : colors.textSecondary,
                        },
                      ]}
                    >
                      {userTier === "pro"
                        ? t("planPro")
                        : userTier === "bor"
                          ? t("planBor")
                          : t("planFree")}
                    </Text>
                  </View>
                  <View style={styles.subArrowWrap}>
                    <ChevronRight size={16} color={colors.textTertiary} />
                  </View>
                </View>
              </View>
              {user?.subscriptionEndDate ? (
                <View style={styles.subDateRow}>
                  <View style={[styles.subDateDot, { backgroundColor: userTier === "pro" ? colors.primary : userTier === "bor" ? colors.success : colors.textTertiary }]} />
                  <Text style={styles.subDate}>
                    {t("subscriptionEndDate")}:{" "}
                    {new Date(user.subscriptionEndDate).toLocaleDateString()}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        )}

        {/* Language */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.primary + "12" }]}>
              <Globe size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>{t("language")}</Text>
          </View>
          <View style={styles.optionsRow}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.optionPill,
                  language === lang.code && {
                    backgroundColor: colors.primary + "15",
                    borderColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 3,
                  },
                ]}
                onPress={() => handleLanguageChange(lang.code as "uz" | "ru")}
              >
                <View style={[styles.optionDot, { backgroundColor: language === lang.code ? colors.primary : "transparent", borderColor: language === lang.code ? colors.primary : colors.border }]} />
                <Text
                  style={[
                    styles.optionPillText,
                    language === lang.code && {
                      color: colors.primary,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.warning + "12" }]}>
              {theme === "dark" ? (
                <Moon size={16} color={colors.warning} />
              ) : (
                <Sun size={16} color={colors.warning} />
              )}
            </View>
            <Text style={styles.sectionTitle}>{t("theme")}</Text>
          </View>
          <View style={styles.optionsRow}>
            {THEMES.map((item) => (
              <Pressable
                key={item.code}
                style={[
                  styles.optionPill,
                  theme === item.code && {
                    backgroundColor: colors.warning + "15",
                    borderColor: colors.warning,
                    shadowColor: colors.warning,
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 3,
                  },
                ]}
                onPress={() => setTheme(item.code as "light" | "dark")}
              >
                <item.icon
                  size={18}
                  color={
                    theme === item.code ? colors.warning : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.optionPillText,
                    theme === item.code && {
                      color: colors.warning,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {getThemeLabel(item.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Business Day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.secondary + "12" }]}>
              <Info size={16} color={colors.secondary} />
            </View>
            <Text style={styles.sectionTitle}>{t("businessDayHour")}</Text>
          </View>
          <Pressable
            style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={openBusinessDayModal}
          >
            <View style={styles.settingCardLeft}>
              <View style={[styles.settingCardIcon, { backgroundColor: colors.secondary + "12" }]}>
                <Info size={18} color={colors.secondary} />
              </View>
              <View style={styles.settingCardInfo}>
                <Text style={styles.settingCardLabel}>{t("businessDayHour")}</Text>
                <Text style={styles.settingCardHint}>{t("businessDayHourDesc")}</Text>
              </View>
            </View>
            <View style={styles.settingCardRight}>
              <View style={[styles.settingCardValue, { backgroundColor: colors.primary + "10" }]}>
                <Text style={[styles.settingCardValueText, { color: colors.primary }]}>
                  {String(getBusinessDayStartHour()).padStart(2, "0")}:00
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textTertiary} />
            </View>
          </Pressable>
        </View>

        {/* Block code */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.secondary + "12" }]}>
              <Lock size={16} color={colors.secondary} />
            </View>
            <Text style={styles.sectionTitle}>{t("blockCodeTitle")}</Text>
          </View>
          <Pressable
            style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={openBlockWithVerify}
          >
            <View style={styles.settingCardLeft}>
              <View style={[styles.settingCardIcon, { backgroundColor: (blockCode ? colors.success : colors.textTertiary) + "15" }]}>
                <Lock size={18} color={blockCode ? colors.success : colors.textTertiary} />
              </View>
              <View style={styles.settingCardInfo}>
                <View style={styles.settingCardLabelRow}>
                  <View style={[styles.statusDot, { backgroundColor: blockCode ? colors.success : colors.textTertiary }]} />
                  <Text style={styles.settingCardLabel}>
                    {blockCode ? t("blockCodeOn") : t("blockCodeOff")}
                  </Text>
                </View>
                <Text style={styles.settingCardHint}>{t("blockCodeHint")}</Text>
              </View>
            </View>
            <View style={styles.settingCardRight}>
              <ChevronRight size={16} color={colors.textTertiary} />
            </View>
          </Pressable>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: "#0088cc" + "15" }]}>
              <MessageCircle size={16} color="#0088cc" />
            </View>
            <Text style={styles.sectionTitle}>{t("support")}</Text>
          </View>
          <Pressable
            style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: "#0088cc" + "25" }]}
            onPress={() => Linking.openURL("https://t.me/dilbek7011")}
          >
            <View style={[styles.supportIconWrap, { backgroundColor: "#0088cc" + "12" }]}>
              <MessageCircle size={22} color="#0088cc" />
            </View>
            <View style={styles.supportInfo}>
              <Text style={styles.supportLabel}>{t("support")}</Text>
              <Text style={styles.supportHandle}>@dilbek7011</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <>
                <LogOut size={20} color={colors.danger} />
                <Text style={styles.logoutText}>{t("logout")}</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Block code PIN verification modal */}
      <Modal
        visible={showBlockVerify}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockVerify(false)}
      >
        <Pressable
          style={[styles.blockOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowBlockVerify(false)}
        >
          <Pressable
            style={[styles.blockCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Lock size={32} color={colors.warning} />
            <Text style={[styles.blockTitle, { color: colors.text }]}>
              {t("enterBlockCode")}
            </Text>
            <Text style={[styles.blockDesc, { color: colors.textSecondary }]}>
              {t("unlockFormDesc")}
            </Text>
            <TextInput
              style={[styles.blockInput, { color: colors.text, borderColor: blockVerifyError ? colors.danger : colors.border, backgroundColor: colors.surfaceSecondary }]}
              placeholder="0000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={4}
              value={blockVerifyInput}
              onChangeText={(v) => { setBlockVerifyInput(v.replace(/\D/g, "")); if (blockVerifyError) setBlockVerifyError(""); }}
              autoFocus
            />
            {blockVerifyError ? (
              <Text style={{ color: colors.danger, fontSize: FONT_SIZE.sm, fontWeight: "600" }}>{blockVerifyError}</Text>
            ) : null}
            <View style={styles.blockActions}>
              <TouchableOpacity
                style={[styles.blockBtnAction, { backgroundColor: colors.surfaceSecondary, flex: 1 }]}
                onPress={() => setShowBlockVerify(false)}
              >
                <Text style={[styles.blockBtnText, { color: colors.text }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.blockBtnAction, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleVerifyBlockCode}
              >
                <Text style={styles.blockBtnText}>{t("confirm")}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Block code modal */}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <Pressable
          style={[styles.blockOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowBlockModal(false)}
        >
          <Pressable
            style={[styles.blockCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Lock size={32} color={colors.primary} />
            <Text style={[styles.blockTitle, { color: colors.text }]}>
              {blockCode ? t("changeBlockCodeTitle") : t("setBlockCodeTitle")}
            </Text>
            <Text style={[styles.blockDesc, { color: colors.textSecondary }]}>
              {blockCode ? t("enterNew4Digit") : t("protectCodeDesc")}
            </Text>
            <TextInput
              style={[styles.blockInput, { color: colors.text, borderColor: blockError ? colors.danger : colors.border, backgroundColor: colors.surfaceSecondary }]}
              placeholder="0000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={4}
              value={blockInput}
              onChangeText={(v) => { setBlockInput(v.replace(/\D/g, "")); if (blockError) setBlockError(""); }}
              autoFocus
            />
            {!blockCode ? (
              <TextInput
                style={[styles.blockInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
                placeholder={t("repeatCode")}
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={4}
                value={blockInputConfirm}
                onChangeText={(v) => setBlockInputConfirm(v.replace(/\D/g, ""))}
              />
            ) : null}
            {blockError ? (
              <Text style={{ color: colors.danger, fontSize: FONT_SIZE.sm, fontWeight: "600" }}>{blockError}</Text>
            ) : null}
            <View style={styles.blockActions}>
              {blockCode ? (
                <>
                  <TouchableOpacity style={[styles.blockBtnAction, { backgroundColor: colors.danger }]} onPress={handleRemoveBlockCode}>
                    <Text style={styles.blockBtnText}>{t("delete")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.blockBtnAction, { backgroundColor: colors.primary }]} onPress={handleSaveBlockCode}>
                    <Text style={styles.blockBtnText}>{t("update")}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.blockBtnAction, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleSaveBlockCode}>
                  <Text style={styles.blockBtnText}>{t("save")}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <Pressable
          style={[styles.blockOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowProfileModal(false)}
        >
          <Pressable
            style={[styles.blockCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <User size={32} color={colors.primary} />
            <Text style={[styles.blockTitle, { color: colors.text }]}>
              {t("editProfile")}
            </Text>
            <TextInput
              style={[styles.blockInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
              placeholder={t("username")}
              placeholderTextColor={colors.textTertiary}
              value={profileUsername}
              onChangeText={setProfileUsername}
              autoFocus
            />
            <TextInput
              style={[styles.blockInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
              placeholder={t("phoneNumber")}
              placeholderTextColor={colors.textTertiary}
              value={profilePhone}
              onChangeText={setProfilePhone}
              keyboardType="phone-pad"
            />
            <View style={styles.blockActions}>
              <TouchableOpacity
                style={[styles.blockBtnAction, { backgroundColor: colors.surfaceSecondary, flex: 1 }]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={[styles.blockBtnText, { color: colors.text }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.blockBtnAction, { backgroundColor: colors.primary, flex: 1 }]}
                disabled={profileSaving || !profileUsername.trim()}
                onPress={async () => {
                  if (!profileUsername.trim()) return;
                  setProfileSaving(true);
                  await updateProfile({
                    username: profileUsername.trim(),
                    phone_number: profilePhone.trim() || undefined,
                  });
                  setProfileSaving(false);
                  setShowProfileModal(false);
                }}
              >
                {profileSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.blockBtnText}>{t("save")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Business Day Modal */}
      <Modal
        visible={showBusinessDayModal}
        animationType="slide"
        transparent
        onRequestClose={cancelBusinessDayChange}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={cancelBusinessDayChange}
        >
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, SPACING.lg),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {confirmStep ? t("confirm") : t("businessDayHour")}
              </Text>
              <TouchableOpacity onPress={cancelBusinessDayChange}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>
                  {t("close")}
                </Text>
              </TouchableOpacity>
            </View>

            {confirmStep ? (
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View
                  style={[
                    styles.confirmBody,
                    {
                      borderTopWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.confirmRow}>
                    <Text
                      style={[
                        styles.confirmLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Joriy vaqt:
                    </Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {String(getBusinessDayStartHour()).padStart(2, "0")}:00
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text
                      style={[
                        styles.confirmLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Yangi vaqt:
                    </Text>
                    <Text
                      style={[styles.confirmValue, { color: colors.primary }]}
                    >
                      {String(editingHour).padStart(2, "0")}:00
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text
                      style={[
                        styles.confirmLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Kuchga kiradi:
                    </Text>
                    <Text
                      style={[styles.confirmValue, { color: colors.warning }]}
                    >
                      {dayjs()
                        .add(1, "day")
                        .startOf("day")
                        .hour(editingHour)
                        .format("DD.MM.YYYY HH:mm")}
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text
                      style={[
                        styles.confirmLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Hisob davri:
                    </Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {dayjs()
                        .add(1, "day")
                        .startOf("day")
                        .hour(editingHour)
                        .format("DD.MM HH:mm")}
                      {" - "}
                      {dayjs()
                        .add(2, "day")
                        .startOf("day")
                        .hour(editingHour)
                        .format("DD.MM HH:mm")}
                    </Text>
                  </View>
                </View>
                <View style={styles.confirmInfo}>
                  <Info size={14} color={colors.warning} />
                  <Text
                    style={[
                      styles.confirmInfoText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("businessDayConfirmInfo")}
                  </Text>
                </View>
                <View style={styles.confirmActions}>
                  <Pressable
                    style={[
                      styles.confirmBtn,
                      { flex: 1, backgroundColor: colors.border },
                    ]}
                    onPress={() => setConfirmStep(false)}
                  >
                    <Text
                      style={[styles.confirmBtnText, { color: colors.text }]}
                    >
                      {t("back")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.confirmBtn,
                      { flex: 1, backgroundColor: colors.primary },
                    ]}
                    onPress={confirmBusinessDayChange}
                  >
                    <Text
                      style={[styles.confirmBtnText, { color: colors.white }]}
                    >
                      {t("confirm")}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textTertiary },
                  ]}
                >
                  {t("businessDayHourDesc")}
                </Text>
                {getPendingBusinessDayStartHour() !== null && (
                  <View
                    style={[
                      styles.pendingBadge,
                      {
                        backgroundColor: colors.warning + "20",
                        borderColor: colors.warning + "40",
                        borderWidth: 1,
                        borderRadius: BORDER_RADIUS.sm,
                        padding: SPACING.sm,
                        marginBottom: SPACING.sm,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: SPACING.xs,
                      },
                    ]}
                  >
                    <Info size={14} color={colors.warning} />
                    <Text
                      style={[
                        styles.pendingBadgeText,
                        {
                          color: colors.warning,
                          fontSize: FONT_SIZE.sm,
                          fontWeight: "500",
                        },
                      ]}
                    >
                      Kutilayotgan:{" "}
                      {String(getPendingBusinessDayStartHour()).padStart(
                        2,
                        "0"
                      )}
                      :00 ({dayjs(getEffectiveFrom()).format("DD.MM HH:mm")}{" "}
                      dan)
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.businessDayRow,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleBusinessDayDec}
                    style={styles.businessDayBtn}
                  >
                    <Text
                      style={[
                        styles.businessDayBtnText,
                        { color: colors.primary },
                      ]}
                    >
                      -
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.businessDayTimeWrap}>
                    <Text
                      style={[
                        styles.businessDayTime,
                        { color: colors.text },
                      ]}
                    >
                      {String(editingHour).padStart(2, "0")}:00
                    </Text>
                    <Text
                      style={[
                        styles.businessDayExample,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {editingHour === 0
                        ? "00:00 dan 23:59 gacha"
                        : `${String(editingHour).padStart(2, "0")}:00 dan ${String(editingHour - 1 < 0 ? 23 : editingHour - 1).padStart(2, "0")}:59 gacha`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleBusinessDayInc}
                    style={styles.businessDayBtn}
                  >
                    <Text
                      style={[
                        styles.businessDayBtnText,
                        { color: colors.primary },
                      ]}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.infoBox,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.infoBoxText, { color: colors.text }]}>
                    {editingHour === 0
                      ? `00:00 dan 23:59 gacha. Masalan: ${dayjs().format("DD.MM")} 00:00 dan ${dayjs().add(1, "day").format("DD.MM")} 00:00 gacha bir kun hisoblanadi.`
                      : `${String(editingHour).padStart(2, "0")}:00 dan ${String(editingHour - 1 < 0 ? 23 : editingHour - 1).padStart(2, "0")}:59 gacha.\nMasalan: ${dayjs().add(1, "day").startOf("day").hour(editingHour).format("DD.MM HH:mm")} dan ${dayjs().add(2, "day").startOf("day").hour(editingHour).format("DD.MM HH:mm")} gacha bir kun hisoblanadi.`}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: colors.primary,
                      marginTop: SPACING.lg,
                    },
                  ]}
                  onPress={handleBusinessDaySave}
                >
                  <Text
                    style={[styles.confirmBtnText, { color: colors.white }]}
                  >
                    {t("save")}
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: SPACING.lg,
      paddingTop: SPACING.md,
    },
    section: {
      marginBottom: SPACING.xl,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
      paddingHorizontal: 2,
    },
    sectionIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      backgroundColor: colors.surface,
      padding: SPACING.xl,
      borderRadius: BORDER_RADIUS.xl,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 3,
    },
    userAvatarWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
    },
    userRole: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: 3,
    },
    subCard: {
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    subCardRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    subBadgeWrap: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
    },
    subBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
    },
    subBadgeText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
    },
    subArrowWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    subDateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      marginTop: SPACING.md,
      paddingTop: SPACING.sm,
    },
    subDateDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    subDate: {
      fontSize: FONT_SIZE.xs,
      color: colors.textTertiary,
    },
    optionsRow: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    optionPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    optionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
    },
    optionPillText: {
      fontSize: FONT_SIZE.md,
      color: colors.text,
      fontWeight: "600",
    },
    settingCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    settingCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      flex: 1,
    },
    settingCardIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    settingCardInfo: {
      flex: 1,
      gap: 2,
    },
    settingCardLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    settingCardLabel: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
      color: colors.text,
    },
    settingCardHint: {
      fontSize: FONT_SIZE.xs,
      color: colors.textTertiary,
      lineHeight: 16,
    },
    settingCardRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginLeft: SPACING.sm,
    },
    settingCardValue: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    settingCardValueText: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      backgroundColor: colors.surface,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    supportIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    supportInfo: {
      flex: 1,
    },
    supportLabel: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
      color: colors.text,
    },
    supportHandle: {
      fontSize: FONT_SIZE.sm,
      color: "#0088cc",
      fontWeight: "500",
      marginTop: 2,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      backgroundColor: colors.danger + "10",
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.danger + "25",
    },
    logoutText: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.danger,
    },
    footerSpacer: {
      height: 40,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalContent: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: SPACING.lg,
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
    },
    modalClose: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "600",
    },
    modalBody: {
      padding: SPACING.lg,
    },
    pendingBadge: {},
    pendingBadgeText: {},
    settingDescription: {
      fontSize: FONT_SIZE.sm,
      marginBottom: SPACING.sm,
    },
    businessDayRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.lg,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    businessDayBtn: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
    },
    businessDayBtnText: {
      fontSize: 24,
      fontWeight: "700",
    },
    businessDayTime: {
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
      minWidth: 60,
      textAlign: "center",
    },
    businessDayTimeWrap: {
      alignItems: "center",
    },
    businessDayExample: {
      fontSize: FONT_SIZE.xs,
      marginTop: 2,
    },
    infoBox: {
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 1,
    },
    infoBoxText: {
      fontSize: FONT_SIZE.sm,
      lineHeight: 20,
    },
    confirmBody: {
      paddingVertical: SPACING.md,
      marginBottom: SPACING.md,
    },
    confirmRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: SPACING.xs,
    },
    confirmLabel: {
      fontSize: FONT_SIZE.md,
    },
    confirmValue: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
    },
    confirmInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    confirmInfoText: {
      flex: 1,
      fontSize: FONT_SIZE.sm,
      lineHeight: 18,
    },
    confirmActions: {
      flexDirection: "row",
      gap: SPACING.md,
    },
    confirmBtn: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    confirmBtnText: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "600",
    },
    blockOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.xl,
    },
    blockCard: {
      width: "100%",
      maxWidth: 360,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.xl,
      alignItems: "center",
      gap: SPACING.md,
    },
    blockTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
    },
    blockDesc: {
      fontSize: FONT_SIZE.sm,
      textAlign: "center",
    },
    blockInput: {
      width: "100%",
      borderWidth: 1.5,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.md,
      textAlign: "center",
      fontSize: FONT_SIZE.lg,
      fontWeight: "600",
      letterSpacing: 2,
    },
    blockActions: {
      flexDirection: "row",
      gap: SPACING.sm,
      width: "100%",
      marginTop: SPACING.xs,
    },
    blockBtnAction: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    blockBtnText: {
      color: "#ffffff",
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
  });
