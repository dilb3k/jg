import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import dayjs from "dayjs";

import { isPastDate } from "../../src/store";
import { useInventoryScreenStore } from "../../src/store/selectors";
import type { InventoryWithProduct } from "../../src/types";
import {
  getBusinessDate,
  isFutureBusinessDate,
} from "../../src/utils/businessDay";
import {
  formatMoney,
  formatWholeNumber,
  getInventoryMetrics,
  getInventoryTotals,
  parseWholeNumber,
} from "../../src/utils/inventory";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import {
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  type ThemeColors,
} from "../../src/theme";
type FormErrors = {
  currentQty: string;
  general: string;
};

const EMPTY_ERRORS: FormErrors = {
  currentQty: "",
  general: "",
};

export default function InventoryScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    currentInventory,
    loadInventoryByDate,
    loadProducts,
    setCurrentQuantity,
    showToast,
  } = useInventoryScreenStore();

  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getBusinessDate());
  const [selectedProductId, setSelectedProductId] = useState("");
  const [currentQty, setCurrentQty] = useState("");
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDateLoading, setIsDateLoading] = useState(true);

  const isReadOnly = isPastDate(selectedDate);
  const isFutureDate = isFutureBusinessDate(selectedDate);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsDateLoading(true);
      try {
        await loadInventoryByDate(selectedDate);
      } finally {
        if (isMounted) {
          setIsDateLoading(false);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [loadInventoryByDate, selectedDate]);

  const inventoryData = useMemo(() => currentInventory, [currentInventory]);
  const displayedData = isFutureDate ? [] : inventoryData;
  const totals = useMemo(
    () => getInventoryTotals(inventoryData),
    [inventoryData],
  );

  const selectedEntry = useMemo(
    () =>
      inventoryData.find((item) => item.productId === selectedProductId) ||
      null,
    [inventoryData, selectedProductId],
  );

  const preview = useMemo(() => {
    if (!selectedEntry) return null;

    const inputCurrent = parseWholeNumber(currentQty);
    const previousSold = Math.max(
      selectedEntry.startQuantity - selectedEntry.currentQuantity,
      0,
    );
    const nextSold = Math.max(selectedEntry.startQuantity - inputCurrent, 0);

    return {
      previousSold,
      nextSold,
      currentDelta: inputCurrent - selectedEntry.currentQuantity,
      revenue: nextSold * selectedEntry.product.sellPrice,
      profit:
        nextSold *
        (selectedEntry.product.sellPrice - selectedEntry.product.buyPrice),
    };
  }, [selectedEntry, currentQty]);

  const handleDateChange = (days: number) => {
    setSelectedDate(dayjs(selectedDate).add(days, "day").format("YYYY-MM-DD"));
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProductId("");
    setCurrentQty("");
    setErrors(EMPTY_ERRORS);
  };

  const openEntry = (item: InventoryWithProduct) => {
    if (isFutureDate) return;

    setSelectedProductId(item.productId);
    setCurrentQty(String(item.currentQuantity));
    setErrors(EMPTY_ERRORS);
    setShowModal(true);
  };

  const validateInputs = (): boolean => {
    if (!selectedEntry) return false;

    const inputCurrent = parseWholeNumber(currentQty);
    const nextErrors: FormErrors = {
      currentQty: "",
      general: "",
    };

    if (inputCurrent > selectedEntry.currentQuantity) {
      nextErrors.currentQty = t("cannotIncreaseStock");
    }

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSave = async () => {
    if (!selectedEntry || isReadOnly || isFutureDate) return;
    if (!validateInputs()) return;

    const inputCurrent = parseWholeNumber(currentQty);

    setIsSubmitting(true);
    try {
      await setCurrentQuantity(
        selectedEntry.productId,
        selectedDate,
        inputCurrent,
      );

      await loadInventoryByDate(selectedDate);
      closeModal();
      showToast(t("inventoryUpdated"), "success");
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || t("saveError"),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: InventoryWithProduct }) => {
    const metrics = getInventoryMetrics(item);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openEntry(item)}
        activeOpacity={0.85}
      >
        {item.product.image ? (
          <Image
            source={{ uri: item.product.image }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : null}

        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.productName}>{item.product.name}</Text>
            <Text style={styles.productPrice}>
              {formatMoney(item.product.sellPrice)}
            </Text>
          </View>

          <View
            style={[
              styles.quantityBadge,
              metrics.remaining <= 5 && styles.quantityBadgeLow,
            ]}
          >
            <Text style={styles.quantityBadgeText}>{metrics.remaining}</Text>
          </View>
        </View>

        <View style={styles.quantityRow}>
          <View style={styles.quantityItem}>
            <Text style={styles.quantityLabel}>{t("start")}</Text>
            <Text style={styles.quantityValue}>{item.startQuantity}</Text>
          </View>
          <View style={styles.quantityItem}>
            <Text style={styles.quantityLabel}>{t("remaining")}</Text>
            <Text
              style={[
                styles.quantityValue,
                metrics.remaining <= 5 ? styles.loss : null,
              ]}
            >
              {metrics.remaining}
            </Text>
          </View>
          <View style={styles.quantityItem}>
            <Text style={styles.quantityLabel}>{t("sold")}</Text>
            <Text
              style={[
                styles.quantityValue,
                metrics.sold > 0 ? styles.profit : null,
              ]}
            >
              {metrics.sold}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t("revenue")}</Text>
            <Text style={styles.statValue}>{formatMoney(metrics.revenue)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t("unitProfit")}</Text>
            <Text
              style={[
                styles.statValue,
                item.product.sellPrice - item.product.buyPrice >= 0
                  ? styles.profit
                  : styles.loss,
              ]}
            >
              {formatMoney(item.product.sellPrice - item.product.buyPrice)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t("profit")}</Text>
            <Text
              style={[
                styles.statValue,
                metrics.realizedProfit >= 0 ? styles.profit : styles.loss,
              ]}
            >
              {formatMoney(metrics.realizedProfit)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t("stockValue")}</Text>
            <Text style={styles.statValue}>
              {formatMoney(metrics.stockSellValue)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateNav}>
        <TouchableOpacity
          style={[styles.navButton, isDateLoading && styles.navButtonDisabled]}
          onPress={() => handleDateChange(-1)}
          disabled={isDateLoading}
        >
          <Text style={styles.navButtonText}>{"<"}</Text>
        </TouchableOpacity>

        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>
            {dayjs(selectedDate).format("DD MMM YYYY")}
          </Text>
          <Text style={styles.dayName}>
            {dayjs(selectedDate).format("dddd")}
          </Text>
          {isReadOnly ? (
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyText}>{t("readOnly")}</Text>
            </View>
          ) : null}
          {isFutureDate ? (
            <View style={styles.futureBadge}>
              <Text style={styles.futureText}>{t("futureDate")}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.navButton, isDateLoading && styles.navButtonDisabled]}
          onPress={() => handleDateChange(1)}
          disabled={isDateLoading}
        >
          <Text style={styles.navButtonText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {isDateLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingTitle}>{t("loading")}</Text>
          <Text style={styles.loadingText}>{t("loadingInventory")}</Text>
        </View>
      ) : null}

      {!isFutureDate && !isDateLoading ? (
        <View style={styles.totalsSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t("start")}</Text>
            <Text style={styles.summaryValue}>{totals.start}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t("remaining")}</Text>
            <Text style={styles.summaryValue}>{totals.current}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t("sold")}</Text>
            <Text style={[styles.summaryValue, styles.profit]}>
              {totals.sold}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t("profit")}</Text>
            <Text
              style={[
                styles.summaryValue,
                totals.profit >= 0 ? styles.profit : styles.loss,
              ]}
            >
              {formatWholeNumber(totals.profit)}
            </Text>
          </View>
        </View>
      ) : !isDateLoading ? (
        <View style={styles.futureNotice}>
          <Text style={styles.futureNoticeTitle}>{t("futureDateNotice")}</Text>
          <Text style={styles.futureNoticeText}>
            {t("futureDateNoticeText")}
          </Text>
        </View>
      ) : null}

      {!isDateLoading ? (
        <FlatList
          data={displayedData}
          keyExtractor={(item) => item.localId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isFutureDate ? t("notAvailableYet") : t("noProductsFound")}
              </Text>
              <Text style={styles.emptySubtext}>
                {isFutureDate
                  ? t("futureDateNoticeText")
                  : t("addProductsFirst")}
              </Text>
            </View>
          }
        />
      ) : null}

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.cancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isReadOnly ? t("readOnlyMode") : t("currentInventory")}
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalBody}
          >
            {selectedEntry ? (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>
                    {selectedEntry.product.name}
                  </Text>
                  <Text style={styles.infoText}>{t("inventoryInfo")}</Text>
                </View>

                {isReadOnly ? (
                  <View style={styles.readOnlyBox}>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>{t("start")}</Text>
                      <Text style={styles.previewValue}>
                        {selectedEntry.startQuantity}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>
                        {t("currentQuantityInv")}
                      </Text>
                      <Text style={styles.previewValue}>
                        {selectedEntry.currentQuantity}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>{t("sold")}</Text>
                      <Text style={styles.previewValue}>
                        {Math.max(
                          selectedEntry.startQuantity -
                            selectedEntry.currentQuantity,
                          0,
                        )}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.label}>{t("startQuantity")}</Text>
                    <View style={styles.readOnlyBox}>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>
                          {t("todayStart")}
                        </Text>
                        <Text style={styles.previewValue}>
                          {selectedEntry.startQuantity}
                        </Text>
                      </View>
                      <Text style={styles.autoHint}>{t("startQtyAuto")}</Text>
                    </View>

                    <Text style={styles.label}>{t("currentQuantityInv")}</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.currentQty ? styles.inputError : null,
                      ]}
                      value={currentQty}
                      onChangeText={(text) => {
                        setCurrentQty(text.replace(/[^\d]/g, ""));
                        setErrors((prev) => ({
                          ...prev,
                          currentQty: "",
                          general: "",
                        }));
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                    />
                    {!!errors.currentQty && (
                      <Text style={styles.errorText}>{errors.currentQty}</Text>
                    )}

                    {preview ? (
                      <View style={styles.previewCard}>
                        <Text style={styles.previewTitle}>
                          {t("preSaveCheck")}
                        </Text>

                        <View style={styles.warningBanner}>
                          <Text style={styles.warningBannerText}>
                            {t("warning_qtyAdjust")}
                          </Text>
                        </View>

                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>
                            {t("previousSold")}
                          </Text>
                          <Text style={styles.previewValue}>
                            {preview.previousSold}
                          </Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>
                            {t("newSold")}
                          </Text>
                          <Text style={styles.previewValue}>
                            {preview.nextSold}
                          </Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>
                            {t("expectedRevenue")}
                          </Text>
                          <Text style={styles.previewValue}>
                            {formatMoney(preview.revenue)}
                          </Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>
                            {t("expectedProfit")}
                          </Text>
                          <Text
                            style={[
                              styles.previewValue,
                              preview.profit >= 0 ? styles.profit : styles.loss,
                            ]}
                          >
                            {formatMoney(preview.profit)}
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {!!errors.general && (
                      <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>
                          {errors.general}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </>
            ) : null}
          </ScrollView>

          {!isReadOnly ? (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={closeModal}
                activeOpacity={0.7}
                style={styles.backButton}
              >
                <Text style={styles.backText}>{t("back")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>{t("save")}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    dateNav: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: SPACING.lg,
    },
    navButton: {
      width: 44,
      height: 44,
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
    },
    navButtonDisabled: {
      opacity: 0.55,
    },
    navButtonText: {
      fontSize: FONT_SIZE.xl,
      color: colors.primary,
      fontWeight: "600",
    },
    dateDisplay: { alignItems: "center", flex: 1 },
    dateText: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: colors.text },
    dayName: { fontSize: FONT_SIZE.sm, color: colors.textSecondary },
    readOnlyBadge: {
      marginTop: 6,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    readOnlyText: { fontSize: FONT_SIZE.xs, color: colors.text },
    futureBadge: {
      marginTop: 6,
      backgroundColor: "#FEF3C7",
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.full,
    },
    futureText: { fontSize: FONT_SIZE.xs, color: "#92400E" },
    totalsSummary: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    summaryItem: { alignItems: "center", flex: 1 },
    summaryLabel: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },
    summaryValue: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
    },
    futureNotice: {
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
      backgroundColor: "#FFF7ED",
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: "#FED7AA",
    },
    loadingCard: {
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      gap: SPACING.xs,
    },
    loadingTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    loadingText: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    futureNoticeTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: "#9A3412",
      marginBottom: SPACING.xs,
    },
    futureNoticeText: {
      fontSize: FONT_SIZE.sm,
      color: "#9A3412",
      lineHeight: 20,
    },
    list: { padding: SPACING.lg },
    emptyContainer: { alignItems: "center", marginTop: SPACING.xxxl },
    emptyText: { fontSize: FONT_SIZE.lg, color: colors.textSecondary },
    emptySubtext: {
      marginTop: SPACING.xs,
      fontSize: FONT_SIZE.sm,
      color: colors.textTertiary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
    },
    productImage: {
      width: 72,
      height: 72,
      borderRadius: BORDER_RADIUS.sm,
      marginBottom: SPACING.sm,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    cardTitleWrap: { flex: 1 },
    productName: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
    },
    productPrice: { fontSize: FONT_SIZE.sm, color: colors.textSecondary },
    quantityBadge: {
      minWidth: 42,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    quantityBadgeLow: { backgroundColor: colors.danger },
    quantityBadgeText: {
      color: colors.white,
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
    },
    quantityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    quantityItem: { alignItems: "center", flex: 1 },
    quantityLabel: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },
    quantityValue: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: SPACING.md,
      gap: SPACING.sm,
    },
    statItem: { flex: 1, alignItems: "center" },
    statLabel: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },
    statValue: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
    },
    profit: { color: colors.secondary },
    loss: { color: colors.danger },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cancelText: { fontSize: FONT_SIZE.md, color: colors.textSecondary },
    modalTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
    },
    modalHeaderSpacer: { width: 60 },
    modalContent: { flex: 1 },
    modalBody: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
    infoBox: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: "#F3F4F6",
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    backButtonPressed: {
      backgroundColor: "#E5E7EB",
      transform: [{ scale: 0.98 }],
    },

    backText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#374151",
    },
    infoTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    infoText: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    readOnlyBox: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    autoHint: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    label: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      fontSize: FONT_SIZE.lg,
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    inputError: {
      borderWidth: 1,
      borderColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: FONT_SIZE.sm,
      marginTop: -4,
      marginBottom: SPACING.sm,
      marginLeft: 2,
    },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginTop: SPACING.md,
      gap: SPACING.sm,
    },
    previewTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: SPACING.md,
    },
    previewLabel: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      flex: 1,
    },
    previewValue: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
      color: colors.text,
      textAlign: "right",
    },
    warningBanner: {
      backgroundColor: "#FFF7ED",
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm,
      borderWidth: 1,
      borderColor: "#FED7AA",
    },
    warningBannerText: {
      fontSize: FONT_SIZE.sm,
      color: "#9A3412",
      lineHeight: 20,
    },
    errorBanner: {
      marginTop: SPACING.md,
      backgroundColor: "#FEF2F2",
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: "#FECACA",
    },
    errorBannerText: {
      fontSize: FONT_SIZE.sm,
      color: "#B91C1C",
      lineHeight: 20,
    },
    modalFooter: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      padding: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    saveButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
  });
