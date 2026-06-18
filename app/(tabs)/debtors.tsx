import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2, UserPlus, History, Pencil } from "lucide-react-native";

import { SearchInputWithClear } from "../../src/components/SearchInputWithClear";

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
import { formatPhone, displayPhone } from "../../src/utils/phone";

export default function DebtorsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { showToast } = useStore();

  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offlineMessage, setOfflineMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editErrors, setEditErrors] = useState<{ name: string }>({ name: "" });

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

  const loadDebtorsRef = useRef(loadDebtors);

  useEffect(() => {
    loadDebtorsRef.current = loadDebtors;
  }, [loadDebtors]);

  useEffect(() => {
    loadDebtors();
  }, [loadDebtors]);

  const resetAddForm = () => {
    setAddName("");
    setAddAmount("");
    setAddPhone("+998");
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

  const openEdit = (debtor: Debtor) => {
    setEditName(debtor.name);
    setEditPhone(debtor.phone || "");
    setEditNotes(debtor.notes || "");
    setEditErrors({ name: "" });
    setShowEditModal(true);
  };

  const validateEditForm = (): boolean => {
    if (!editName.trim()) {
      setEditErrors({ name: t("nameRequired") });
      return false;
    }
    setEditErrors({ name: "" });
    return true;
  };

  const handleEdit = async () => {
    if (!selectedDebtor || !validateEditForm()) return;
    setIsEditing(true);
    try {
      const updated = await apiClient.updateDebtor(selectedDebtor.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setSelectedDebtor(updated);
      setShowEditModal(false);
      await loadDebtors();
      showToast(t("debtorSaved"), "success");
    } catch (err: any) {
      showToast(err.message || t("error"), "error");
    } finally {
      setIsEditing(false);
    }
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

  const filteredDebtors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return debtors;
    return debtors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.phone && d.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))),
    );
  }, [debtors, searchQuery]);

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

          <View style={styles.searchRow}>
            <SearchInputWithClear
              colors={colors}
              placeholder={t("search")}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filteredDebtors}
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
                    <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                    {item.phone ? (
                      <Text style={styles.cardPhone}>{displayPhone(item.phone)}</Text>
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
                <Text style={styles.emptyText}>
                  {searchQuery.trim() ? t("noProductsFound") : t("noDebtors")}
                </Text>
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
          behavior="padding"
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
              placeholder="+998"
              placeholderTextColor={colors.textTertiary}
              value={addPhone}
              onChangeText={(v) => setAddPhone(formatPhone(v))}
              keyboardType="phone-pad"
              maxLength={17}
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
          behavior="padding"
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
            <View style={{ flexDirection: "row", gap: SPACING.md }}>
              <TouchableOpacity
                onPress={() => selectedDebtor && openEdit(selectedDebtor)}
              >
                <Pencil size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectedDebtor && handleDelete(selectedDebtor)}
              >
                <Trash2 size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>

          {selectedDebtor && (
            <>
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="always"
              >
                <View style={styles.detailHeader}>
                  <Text style={styles.detailName} numberOfLines={1}>{selectedDebtor.name}</Text>
                  {selectedDebtor.phone ? (
                    <Text style={styles.detailPhone}>{displayPhone(selectedDebtor.phone)}</Text>
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

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top }]}
          behavior="padding"
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("editDebtor")}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="always"
          >
            <Text style={styles.label}>{t("debtorName")}</Text>
            <TextInput
              style={[styles.input, editErrors.name ? styles.inputError : null]}
              placeholder={t("enterName")}
              placeholderTextColor={colors.textTertiary}
              value={editName}
              onChangeText={(v) => { setEditName(v); if (editErrors.name) setEditErrors({ name: "" }); }}
              autoCapitalize="words"
            />
            {editErrors.name ? <Text style={styles.errorText}>{editErrors.name}</Text> : null}

            <Text style={styles.label}>{t("phoneNumber")}</Text>
            <TextInput
              style={styles.input}
              placeholder="+998"
              placeholderTextColor={colors.textTertiary}
              value={editPhone}
              onChangeText={(v) => setEditPhone(formatPhone(v))}
              keyboardType="phone-pad"
              maxLength={17}
            />

            <Text style={styles.label}>{t("debtNotesOrExtra")}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder={t("debtNotesOrExtra")}
              placeholderTextColor={colors.textTertiary}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!editName.trim() || isEditing) && styles.saveButtonDisabled,
              ]}
              onPress={handleEdit}
              disabled={isEditing}
            >
              {isEditing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>{t("save")}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
      marginBottom: SPACING.sm,
      padding: SPACING.xl,
      borderRadius: BORDER_RADIUS.xl,
      alignItems: "center",
      boxShadow: "0px 6px 20px rgba(139, 92, 246, 0.3)",
      elevation: 4,
    },
    summaryLabel: {
      fontSize: FONT_SIZE.sm,
      color: colors.white + "CC",
      marginBottom: SPACING.xs,
      fontWeight: "500",
    },
    summaryValue: {
      fontSize: FONT_SIZE.title,
      fontWeight: "800",
      color: colors.white,
      letterSpacing: 0.5,
    },
    summaryCount: {
      marginTop: SPACING.xs,
      fontSize: FONT_SIZE.sm,
      color: colors.white + "AA",
    },
    searchRow: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    list: { padding: SPACING.lg, paddingTop: 0, paddingBottom: 100 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 0.5,
      borderColor: colors.border,
      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
      elevation: 2,
    },
    cardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      flex: 1,
    },
    indexBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
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
      color: colors.primary,
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
      paddingBottom: SPACING.xl,
      backgroundColor: colors.surface,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    addButton: {
      backgroundColor: colors.primary,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.sm,
      boxShadow: "0px 4px 12px rgba(139, 92, 246, 0.3)",
      elevation: 3,
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
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backText: { fontSize: FONT_SIZE.md, color: colors.primary, fontWeight: "600" },
    modalTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
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
      backgroundColor: colors.surfaceSecondary,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      marginBottom: SPACING.md,
      fontSize: FONT_SIZE.md,
      color: colors.text,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    inputError: {
      borderColor: colors.danger,
      borderWidth: 1,
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
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
      marginTop: SPACING.sm,
      boxShadow: "0px 4px 12px rgba(16, 185, 129, 0.3)",
      elevation: 3,
    },
    saveButtonDisabled: { opacity: 0.5 },
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
      fontSize: FONT_SIZE.xxl,
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
      lineHeight: 20,
    },
    notesInput: {
      minHeight: 88,
    },
    detailAmountCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      alignItems: "center",
      width: "100%",
      borderWidth: 1,
      borderColor: colors.danger + "30",
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
      borderBottomWidth: 0.5,
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
      color: colors.primary,
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
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    adjustInput: {
      backgroundColor: colors.surfaceSecondary,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      marginBottom: SPACING.xs,
      fontSize: FONT_SIZE.md,
      color: colors.text,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    adjustInputError: {
      borderColor: colors.danger,
      borderWidth: 1,
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
      borderRadius: BORDER_RADIUS.lg,
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
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 0.5,
    },
    offlineBannerText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "600",
      textAlign: "center",
    },
  });
