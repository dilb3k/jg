import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Package } from "lucide-react-native";
import { SearchInputWithClear } from "../../src/components/SearchInputWithClear";

import DateTimePicker from "@react-native-community/datetimepicker";

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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    inventorySummary,
    loadInventoryByDate,
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();

  const isReadOnly = isPastDate(selectedDate);
  const isFutureDate = isFutureBusinessDate(selectedDate);

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

  const displayedData = useMemo(() => {
    if (isFutureDate) return [];
    if (!searchQuery.trim()) return inventoryData;
    const query = searchQuery.trim().toLowerCase();
    return inventoryData.filter((item) => {
      const productName = item.product?.name?.toLowerCase() || "";
      return productName.includes(query);
    });
  }, [isFutureDate, inventoryData, searchQuery]);

  const totals = useMemo(
    () => getInventoryTotals(inventoryData, inventorySummary),
    [inventoryData, inventorySummary],
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
    const nextErrors: FormErrors = { currentQty: "", general: "" };
    if (inputCurrent > selectedEntry.startQuantity) {
      nextErrors.currentQty = t("cannotAddMoreThanSold");
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

  const getStockStatus = (remaining: number) => {
    if (remaining <= 0) return { label: "Tugagan", color: colors.danger };
    if (remaining <= 5) return { label: "Kam", color: colors.warning };
    return { label: "Bor", color: colors.success };
  };

  const renderItem = ({ item }: { item: InventoryWithProduct }) => {
    const metrics = getInventoryMetrics(item);
    const stockStatus = getStockStatus(metrics.remaining);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openEntry(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTitleRow}>
            {item.product.image ? (
              <Image
                source={{ uri: item.product.image }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImageBox}>
                <Package size={20} color={colors.textTertiary} />
              </View>
            )}
            <View style={styles.cardTitleWrap}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.product.displayIndex && item.product.displayIndex > 0 ? `#${item.product.displayIndex}` : ""} {item.product.name}
              </Text>
              <Text style={styles.productPrice}>
                {formatMoney(item.product.sellPrice)}
              </Text>
            </View>
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.color + "20" }]}>
              <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
              <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                {stockStatus.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quantityRow}>
          <View style={styles.quantityItem}>
            <Text style={styles.quantityLabel}>{t("start")}</Text>
            <Text style={styles.quantityValue}>{item.startQuantity}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.quantityItem}>
            <Text style={styles.quantityLabel}>{t("remaining")}</Text>
            <Text
              style={[
                styles.quantityValue,
                metrics.remaining <= 5 ? { color: colors.danger } : null,
              ]}
            >
              {metrics.remaining}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.quantityItem}>
            <Text style={styles.quantityLabel}>{t("sold")}</Text>
            <Text
              style={[
                styles.quantityValue,
                metrics.sold > 0 ? { color: colors.secondary } : null,
              ]}
            >
              {metrics.sold}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItemGroup}>
            <Text style={styles.statsLabelSmall}>{t("revenue")}</Text>
            <Text style={styles.statValue}>{formatMoney(metrics.revenue)}</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statItemGroup}>
            <Text style={styles.statsLabelSmall}>{t("stockValue")}</Text>
            <Text style={styles.statValue}>{formatMoney(metrics.stockSellValue)}</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statItemGroup}>
            <View style={styles.unitProfitRow}>
              <Text style={styles.unitProfitLabel}>{t("unitProfit")}</Text>
              <Text style={[styles.unitProfitValue, { color: colors.secondary }]}>
                {formatMoney(item.product.sellPrice - item.product.buyPrice)}
              </Text>
            </View>
            <Text style={[styles.statProfit, metrics.realizedProfit >= 0 ? { color: colors.secondary } : { color: colors.danger }]}>
              {t("profit")}: {formatMoney(metrics.realizedProfit)}
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
          <ChevronLeft size={22} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateDisplay}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {dayjs(selectedDate).format("DD MMM YYYY")}
          </Text>
          <Text style={styles.dayName}>
            {dayjs(selectedDate).format("dddd")}
          </Text>

          {isReadOnly && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t("readOnly")}</Text>
            </View>
          )}
          {isFutureDate && (
            <View style={[styles.badge, { backgroundColor: colors.warning + "20" }]}>
              <Text style={[styles.badgeText, { color: colors.warning }]}>
                {t("futureDate")}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, isDateLoading && styles.navButtonDisabled]}
          onPress={() => handleDateChange(1)}
          disabled={isDateLoading}
        >
          <ChevronRight size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isDateLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>{t("loading")}</Text>
          <Text style={styles.loadingText}>{t("loadingInventory")}</Text>
        </View>
      ) : null}

      {!isFutureDate && !isDateLoading && (
        <View style={styles.searchRow}>
          <SearchInputWithClear
            colors={colors}
            placeholder={t("search") || "Qidirish..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      {!isFutureDate && !isDateLoading && (
        <View style={styles.totalsSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t("start")}</Text>
            <Text style={styles.summaryValue}>{totals.start}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t("remaining")}</Text>
            <Text style={styles.summaryValue}>{totals.current}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t("sold")}</Text>
            <Text style={[styles.summaryValue, { color: colors.secondary }]}>
              {totals.sold}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t("profit")}</Text>
            <Text
              style={[
                styles.summaryValue,
                (totals.profit ?? 0) >= 0
                  ? { color: colors.secondary }
                  : { color: colors.danger },
              ]}
            >
              {formatWholeNumber(totals.profit ?? 0)}
            </Text>
          </View>
        </View>
      )}

      {!isFutureDate && !isDateLoading ? (
        <FlatList
          data={displayedData}
          keyExtractor={(item) => item.localId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>{t("noProductsFound")}</Text>
              <Text style={styles.emptySubtext}>{t("addProductsFirst")}</Text>
            </View>
          }
        />
      ) : isFutureDate && !isDateLoading ? (
        <View style={styles.futureNotice}>
          <Text style={styles.futureNoticeTitle}>{t("futureDateNotice")}</Text>
          <Text style={styles.futureNoticeText}>
            {t("futureDateNoticeText")}
          </Text>
        </View>
      ) : null}

      {/* MODAL */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalContainer, { paddingTop: insets.top }]}
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
            {selectedEntry && (
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

                    {preview && (
                      <View style={styles.previewCard}>
                        <Text style={styles.previewTitle}>
                          {t("preSaveCheck")}
                        </Text>
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
                              preview.profit >= 0
                                ? { color: colors.secondary }
                                : { color: colors.danger },
                            ]}
                          >
                            {formatMoney(preview.profit)}
                          </Text>
                        </View>
                      </View>
                    )}

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
            )}
          </ScrollView>

          {!isReadOnly && (
            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.backButton}
                activeOpacity={0.7}
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
          )}
        </KeyboardAvoidingView>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(selectedDate)}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
            }
          }}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Date Navigation
    dateNav: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: SPACING.lg,
      paddingBottom: SPACING.sm,
    },
    navButton: {
      width: 44,
      height: 44,
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    navButtonDisabled: { opacity: 0.55 },
    dateDisplay: { alignItems: "center", flex: 1 },
    dateText: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
    },
    dayName: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      marginTop: 6,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeText: { fontSize: FONT_SIZE.xs, color: colors.text },

    // Search
    searchRow: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
    },

    // Summary
    totalsSummary: {
      flexDirection: "row",
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: SPACING.sm,
    },
    summaryLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
    },

    // Loading
    loadingCard: {
      margin: SPACING.lg,
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.xl,
      alignItems: "center",
      gap: SPACING.sm,
    },
    loadingTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
    },
    loadingText: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      textAlign: "center",
    },

    // Future notice
    futureNotice: {
      margin: SPACING.lg,
      backgroundColor: colors.warning + "10",
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.warning + "40",
    },
    futureNoticeTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.warning,
    },
    futureNoticeText: {
      fontSize: FONT_SIZE.sm,
      color: colors.warning,
      lineHeight: 20,
      marginTop: SPACING.sm,
    },

    // List
    list: { padding: SPACING.lg, paddingTop: 0, paddingBottom: SPACING.xxxl },
    emptyContainer: { alignItems: "center", marginTop: SPACING.xxxl },
    emptyText: {
      fontSize: FONT_SIZE.lg,
      color: colors.textSecondary,
      marginTop: SPACING.md,
    },
    emptySubtext: {
      marginTop: SPACING.xs,
      fontSize: FONT_SIZE.sm,
      color: colors.textTertiary,
    },

    // Card
    card: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTop: { marginBottom: SPACING.md },
    cardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    productImage: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.sm,
    },
    noImageBox: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    cardTitleWrap: { flex: 1 },
    productName: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
    },
    productPrice: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    stockBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.full,
    },
    stockDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    stockBadgeText: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "700",
    },

    // Quantities
    quantityRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm,
      marginBottom: SPACING.md,
    },
    quantityItem: { flex: 1, alignItems: "center" },
    separator: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
    },
    quantityLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.textTertiary,
      marginBottom: 2,
    },
    quantityValue: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: SPACING.md,
    },
    statsDivider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: colors.border,
      marginHorizontal: SPACING.sm,
    },
    statItemGroup: { flex: 1, alignItems: "center" },
    statsLabelSmall: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    statValue: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
      color: colors.text,
    },
    unitProfitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginTop: 4,
    },
    unitProfitLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.textTertiary,
    },
    unitProfitValue: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "700",
    },
    statProfit: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "600",
      marginTop: 2,
    },

    // Modal
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
    infoTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
    },
    infoText: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      lineHeight: 20,
      marginTop: 4,
    },

    readOnlyBox: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      gap: SPACING.sm,
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
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputError: { borderWidth: 1, borderColor: colors.danger },
    errorText: { color: colors.danger, fontSize: FONT_SIZE.sm, marginTop: 4 },
    autoHint: {
      fontSize: FONT_SIZE.xs,
      color: colors.textTertiary,
      fontStyle: "italic",
    },
    errorBanner: {
      backgroundColor: colors.danger + "15",
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm,
      marginTop: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.danger + "40",
    },
    errorBannerText: { color: colors.danger, fontSize: FONT_SIZE.sm },

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
    previewRow: { flexDirection: "row", justifyContent: "space-between" },
    previewLabel: { fontSize: FONT_SIZE.sm, color: colors.textSecondary },
    previewValue: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
      color: colors.text,
    },

    modalFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: SPACING.md,
      backgroundColor: colors.surface,
    },
    backButton: {
      flex: 1,
      paddingVertical: 14,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    backText: { fontWeight: "600", color: colors.text },
    saveButton: {
      flex: 1,
      paddingVertical: 14,
      backgroundColor: colors.primary,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    saveButtonText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: FONT_SIZE.md,
    },
  });
