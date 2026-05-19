import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2, UserPlus, History } from "lucide-react-native";

import {
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  type ThemeColors,
} from "../../src/theme";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { formatMoney, formatInputAmount, parseFormattedAmount } from "../../src/utils/inventory";
import { apiClient, canReachServer } from "../../src/api/client";
import { useStore } from "../../src/store";
import type { Debtor, DebtHistory } from "../../src/types";

export default function DebtorsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { showToast } = useStore();

  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offlineMessage, setOfflineMessage] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addErrors, setAddErrors] = useState<{ name: string; amount: string }>({ name: "", amount: "" });

  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  const loadDebtors = useCallback(async () => {
    try {
      setIsLoading(true);
      setOfflineMessage("");
      if (!canReachServer()) {
        setOfflineMessage(t("offlineDateWarning"));
        setDebtors([]);
        return;
      }
      const data = await apiClient.getDebtors();
      setDebtors(data.sort((a, b) => b.amount - a.amount));
    } catch (err: any) {
      showToast(err.message || t("error"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    loadDebtors();
  }, [loadDebtors]);

  const resetAddForm = () => {
    setAddName("");
    setAddAmount("");
    setAddPhone("");
    setAddNotes("");
    setAddErrors({ name: "", amount: "" });
  };

  const validateAddForm = (): boolean => {
    const errors = { name: "", amount: "" };
    if (!addName.trim()) errors.name = t("nameRequired");
    const parsed = parseFormattedAmount(addAmount);
    if (!addAmount.trim() || parsed <= 0) errors.amount = t("amountRequired");
    setAddErrors(errors);
    return !errors.name && !errors.amount;
  };

  const handleAdd = async () => {
    if (!validateAddForm()) return;
    const amount = parseFormattedAmount(addAmount);
    setIsAdding(true);
    try {
      await apiClient.createDebtor({
        name: addName.trim(),
        amount,
        phone: addPhone.trim() || undefined,
        notes: addNotes.trim() || undefined,
      });
      setShowAddModal(false);
      resetAddForm();
      await loadDebtors();
      showToast(t("debtorSaved"), "success");
    } catch (err: any) {
      showToast(err.message || t("error"), "error");
    } finally {
      setIsAdding(false);
    }
  };

  const openDetail = (debtor: Debtor) => {
    setSelectedDebtor(debtor);
    setAdjustAmount("");
    setAdjustError("");
    setShowDetailModal(true);
  };

  const validateAdjust = (): boolean => {
    const parsed = parseFormattedAmount(adjustAmount);
    if (!adjustAmount.trim() || parsed <= 0) {
      setAdjustError(t("amountRequired"));
      return false;
    }
    setAdjustError("");
    return true;
  };

  const doAdjust = async (operation: "add" | "subtract") => {
    if (!selectedDebtor) return;
    const value = parseFormattedAmount(adjustAmount);
    setIsAdjusting(true);
    try {
      const updated = await apiClient.adjustDebt(selectedDebtor.id, {
        amount: value,
        type: operation,
      });
      setSelectedDebtor(updated);
      setAdjustAmount("");
      setAdjustError("");
      await loadDebtors();
      showToast(t("debtUpdated"), "success");
    } catch (err: any) {
      showToast(err.message || t("error"), "error");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleAdjust = (operation: "add" | "subtract") => {
    if (!selectedDebtor) return;
    if (!validateAdjust()) return;
    const value = parseFormattedAmount(adjustAmount);

    if (operation === "subtract" && value > selectedDebtor.amount) {
      Alert.alert(
        t("confirm"),
        `${selectedDebtor.name} qarzi ${formatMoney(selectedDebtor.amount)}. ${formatMoney(value)} ayirilsa, ortiqcha summa ${formatMoney(value - selectedDebtor.amount)} qaytarib beriladimi?`,
        [
          { text: t("cancel"), style: "cancel" },
          { text: t("confirm"), style: "destructive", onPress: () => doAdjust("subtract") },
        ],
      );
      return;
    }

    doAdjust(operation);
  };

  const handleDelete = (debtor: Debtor) => {
    Alert.alert(
      t("delete"),
      t("deleteDebtorConfirm").replace("{name}", debtor.name),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.deleteDebtor(debtor.id);
              setShowDetailModal(false);
              setSelectedDebtor(null);
              await loadDebtors();
              showToast(t("debtorDeleted"), "success");
            } catch (err: any) {
              showToast(err.message || t("error"), "error");
            }
          },
        },
      ],
    );
  };

  const totalDebt = useMemo(
    () => debtors.reduce((sum, d) => sum + d.amount, 0),
    [debtors],
  );

  const renderHistoryItem = (item: DebtHistory, index: number) => {
    const isAdd = item.type === "add";
    return (
      <View key={index} style={styles.historyItem}>
        <View style={[styles.historyDot, isAdd ? styles.historyDotAdd : styles.historyDotSubtract]} />
        <View style={styles.historyInfo}>
          <Text style={styles.historyType}>
            {isAdd ? t("added") : t("subtracted")}
          </Text>
          {item.note ? <Text style={styles.historyNote}>{item.note}</Text> : null}
          <Text style={styles.historyDate}>
            {new Date(item.date).toLocaleString()}
          </Text>
        </View>
        <Text style={[styles.historyAmount, isAdd ? styles.historyAmountAdd : styles.historyAmountSubtract]}>
          {isAdd ? "+" : "-"}{formatMoney(item.amount)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {!!offlineMessage && (
            <View style={[styles.offlineBanner, { backgroundColor: colors.warning + "20", borderColor: colors.warning }]}>
              <Text style={[styles.offlineBannerText, { color: colors.warning }]}>
                {offlineMessage}
              </Text>
            </View>
          )}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t("debtAmount")}</Text>
            <Text style={styles.summaryValue}>{formatMoney(totalDebt)}</Text>
            <Text style={styles.summaryCount}>
              {debtors.length} {t("debtors")}
            </Text>
          </View>

          <FlatList
            data={debtors}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => openDetail(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.phone ? (
                      <Text style={styles.cardPhone}>{item.phone}</Text>
                    ) : null}
                    <Text style={styles.cardDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardAmount}>
                  {formatMoney(item.amount)}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("noDebtors")}</Text>
              </View>
            }
          />

          <View style={styles.footer}>
            <Pressable
              style={styles.addButton}
              onPressOut={() => {
                resetAddForm();
                setShowAddModal(true);
              }}
            >
              <UserPlus size={20} color={colors.white} />
              <Text style={styles.addButtonText}> {t("addDebtor")}</Text>
            </Pressable>
          </View>
        </>
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("addDebtor")}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="always"
          >
            <Text style={styles.label}>{t("debtorName")}</Text>
            <TextInput
              style={[styles.input, addErrors.name ? styles.inputError : null]}
              placeholder={t("enterName")}
              placeholderTextColor={colors.textTertiary}
              value={addName}
              onChangeText={(v) => { setAddName(v); if (addErrors.name) setAddErrors((p) => ({ ...p, name: "" })); }}
              autoCapitalize="words"
            />
            {addErrors.name ? <Text style={styles.errorText}>{addErrors.name}</Text> : null}

            <Text style={styles.label}>{t("debtorAmount")}</Text>
            <TextInput
              style={[styles.input, addErrors.amount ? styles.inputError : null]}
              placeholder={t("enterAmount")}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={addAmount}
              onChangeText={(text) => { setAddAmount(formatInputAmount(text)); if (addErrors.amount) setAddErrors((p) => ({ ...p, amount: "" })); }}
            />
            {addErrors.amount ? <Text style={styles.errorText}>{addErrors.amount}</Text> : null}

            <Text style={styles.label}>{t("phoneNumber")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("phoneNumber")}
              placeholderTextColor={colors.textTertiary}
              value={addPhone}
              onChangeText={setAddPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>{t("debtNotesOrExtra")}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder={t("debtNotesOrExtra")}
              placeholderTextColor={colors.textTertiary}
              value={addNotes}
              onChangeText={setAddNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!addName.trim() || isAdding) && styles.saveButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>{t("save")}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowDetailModal(false);
          setSelectedDebtor(null);
        }}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowDetailModal(false);
                setSelectedDebtor(null);
              }}
            >
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("adjustDebt")}</Text>
            <TouchableOpacity
              onPress={() => selectedDebtor && handleDelete(selectedDebtor)}
            >
              <Trash2 size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>

          {selectedDebtor && (
            <>
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="always"
              >
                <View style={styles.detailHeader}>
                  <Text style={styles.detailName}>{selectedDebtor.name}</Text>
                  {selectedDebtor.phone ? (
                    <Text style={styles.detailPhone}>{selectedDebtor.phone}</Text>
                  ) : null}
                  {selectedDebtor.notes ? (
                    <Text style={styles.detailNotes}>{selectedDebtor.notes}</Text>
                  ) : null}
                  <View style={styles.detailAmountCard}>
                    <Text style={styles.detailAmountLabel}>
                      {t("debtAmount")}
                    </Text>
                    <Text style={styles.detailAmountValue}>
                      {formatMoney(selectedDebtor.amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.historySection}>
                  <View style={styles.historySectionHeader}>
                    <History size={18} color={colors.textSecondary} />
                    <Text style={styles.historySectionTitle}>
                      {t("debtHistory")} ({selectedDebtor.history?.length || 0})
                    </Text>
                  </View>
                  {selectedDebtor.history && selectedDebtor.history.length > 0 ? (
                    selectedDebtor.history.map((item, i) => renderHistoryItem(item, i))
                  ) : (
                    <Text style={styles.emptyText}>{t("noData")}</Text>
                  )}
                </View>
              </ScrollView>

              <View style={styles.adjustBar}>
                <TextInput
                  style={[styles.adjustInput, adjustError ? styles.adjustInputError : null]}
                  placeholder={t("enterAmount")}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={adjustAmount}
                  onChangeText={(text) => { setAdjustAmount(formatInputAmount(text)); if (adjustError) setAdjustError(""); }}
                />
                {adjustError ? <Text style={styles.adjustErrorText}>{adjustError}</Text> : null}
                <View style={styles.adjustButtons}>
                  <TouchableOpacity
                    style={[styles.adjustBtn, styles.adjustBtnAdd]}
                    onPress={() => handleAdjust("add")}
                    disabled={isAdjusting}
                  >
                    {isAdjusting ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.adjustBtnText}>+ {t("addToDebt")}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.adjustBtn, styles.adjustBtnSubtract]}
                    onPress={() => handleAdjust("subtract")}
                    disabled={isAdjusting}
                  >
                    {isAdjusting ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.adjustBtnText}>- {t("subtractFromDebt")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    summaryCard: {
      backgroundColor: colors.primary,
      margin: SPACING.lg,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
    },
    summaryLabel: {
      fontSize: FONT_SIZE.sm,
      color: colors.white + "CC",
      marginBottom: SPACING.xs,
    },
    summaryValue: {
      fontSize: FONT_SIZE.xxxl,
      fontWeight: "800",
      color: colors.white,
    },
    summaryCount: {
      marginTop: SPACING.xs,
      fontSize: FONT_SIZE.sm,
      color: colors.white + "AA",
    },
    list: { padding: SPACING.lg, paddingTop: 0, paddingBottom: 100 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    cardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      flex: 1,
    },
    indexBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    indexText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    cardInfo: { flex: 1 },
    cardName: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
      color: colors.text,
    },
    cardPhone: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cardDate: {
      fontSize: FONT_SIZE.xs,
      color: colors.textTertiary,
      marginTop: 2,
    },
    cardAmount: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.danger,
    },
    emptyContainer: {
      alignItems: "center",
      marginTop: SPACING.xxxl,
    },
    emptyText: {
      fontSize: FONT_SIZE.lg,
      color: colors.textTertiary,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: SPACING.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addButton: {
      backgroundColor: colors.primary,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.sm,
    },
    addButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backText: { fontSize: FONT_SIZE.md, color: colors.primary },
    modalTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "600",
      color: colors.text,
    },
    headerSpacer: { width: 60 },
    modalContent: { flex: 1 },
    modalBody: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
    label: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    input: {
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.md,
      fontSize: FONT_SIZE.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: FONT_SIZE.sm,
      marginTop: -SPACING.sm,
      marginBottom: SPACING.md,
    },
    saveButton: {
      backgroundColor: colors.secondary,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
      marginTop: SPACING.sm,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
    detailHeader: {
      alignItems: "center",
      marginBottom: SPACING.xl,
    },
    detailName: {
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    detailPhone: {
      fontSize: FONT_SIZE.md,
      color: colors.primary,
      marginBottom: SPACING.xs,
    },
    detailNotes: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    notesInput: {
      minHeight: 88,
    },
    detailAmountCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      alignItems: "center",
      width: "100%",
      borderWidth: 2,
      borderColor: colors.danger + "40",
    },
    detailAmountLabel: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    detailAmountValue: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: "800",
      color: colors.danger,
    },
    historySection: {
      marginTop: SPACING.lg,
    },
    historySectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    historySectionTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    historyItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginTop: 6,
      marginRight: SPACING.md,
    },
    historyDotAdd: { backgroundColor: colors.danger },
    historyDotSubtract: { backgroundColor: colors.secondary },
    historyInfo: { flex: 1 },
    historyType: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
      color: colors.text,
    },
    historyNote: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    historyDate: {
      fontSize: FONT_SIZE.xs,
      color: colors.textTertiary,
      marginTop: 2,
    },
    historyAmount: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
    historyAmountAdd: { color: colors.danger },
    historyAmountSubtract: { color: colors.secondary },
    adjustBar: {
      padding: SPACING.lg,
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    adjustInput: {
      backgroundColor: colors.background,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.xs,
      fontSize: FONT_SIZE.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    adjustInputError: {
      borderColor: colors.danger,
    },
    adjustErrorText: {
      color: colors.danger,
      fontSize: FONT_SIZE.sm,
      marginBottom: SPACING.sm,
    },
    adjustButtons: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    adjustBtn: {
      flex: 1,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    adjustBtnAdd: {
      backgroundColor: colors.danger,
    },
    adjustBtnSubtract: {
      backgroundColor: colors.secondary,
    },
    adjustBtnText: {
      color: colors.white,
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
    offlineBanner: {
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.lg,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
    },
    offlineBannerText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "600",
      textAlign: "center",
    },
  });
