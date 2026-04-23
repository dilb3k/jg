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

import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "../../src/constants";
import { isPastDate } from "../../src/store";
import { useInventoryScreenStore } from "../../src/store/selectors";
import type { InventoryWithProduct } from "../../src/types";
import { getBusinessDate, isFutureBusinessDate } from "../../src/utils/businessDay";
import {
  formatMoney,
  formatWholeNumber,
  getInventoryMetrics,
  getInventoryTotals,
  parseWholeNumber,
} from "../../src/utils/inventory";

type FormErrors = {
  currentQty: string;
  general: string;
};

const EMPTY_ERRORS: FormErrors = {
  currentQty: "",
  general: "",
};

export default function InventoryScreen() {
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
  const totals = useMemo(() => getInventoryTotals(inventoryData), [inventoryData]);

  const selectedEntry = useMemo(
    () => inventoryData.find((item) => item.productId === selectedProductId) || null,
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
      nextErrors.currentQty =
        "Joriy qoldiqni oshirib bo'lmaydi. Mahsulot qo'shish mahsulotlar sahifasidan qilinadi";
    }

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSave = async () => {
    if (!selectedEntry || isReadOnly || isFutureDate) return;
    if (!validateInputs()) return;

    const inputCurrent = parseWholeNumber(currentQty);

    try {
      await setCurrentQuantity(
        selectedEntry.productId,
        selectedDate,
        inputCurrent,
      );

      await loadInventoryByDate(selectedDate);
      closeModal();
      showToast("Ombor qoldig'i yangilandi", "success");
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "Saqlashda xatolik yuz berdi",
      }));
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
          <Image source={{ uri: item.product.image }} style={styles.productImage} />
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
            <Text style={styles.quantityLabel}>Boshlang&apos;ich</Text>
            <Text style={styles.quantityValue}>{item.startQuantity}</Text>
          </View>
          <View style={styles.quantityItem}>
            <Text style={styles.quantityLabel}>Qoldiq</Text>
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
            <Text style={styles.quantityLabel}>Sotilgan</Text>
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
            <Text style={styles.statLabel}>Tushum</Text>
            <Text style={styles.statValue}>{formatMoney(metrics.revenue)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Birlik foyda</Text>
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
            <Text style={styles.statLabel}>Foyda</Text>
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
            <Text style={styles.statLabel}>Qoldiq qiymati</Text>
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
          <Text style={styles.dayName}>{dayjs(selectedDate).format("dddd")}</Text>
          {isReadOnly ? (
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyText}>Faqat ko&apos;rish</Text>
            </View>
          ) : null}
          {isFutureDate ? (
            <View style={styles.futureBadge}>
              <Text style={styles.futureText}>Kelajak sana</Text>
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
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingTitle}>Ombor ma&apos;lumotlari yuklanmoqda</Text>
          <Text style={styles.loadingText}>
            Sana bo&apos;yicha qoldiq va hisob-kitoblar qayta tayyorlanmoqda.
          </Text>
        </View>
      ) : null}

      {!isFutureDate && !isDateLoading ? (
        <View style={styles.totalsSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Jami boshlang&apos;ich</Text>
            <Text style={styles.summaryValue}>{totals.start}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Jami qoldiq</Text>
            <Text style={styles.summaryValue}>{totals.current}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Sotildi</Text>
            <Text style={[styles.summaryValue, styles.profit]}>{totals.sold}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Foyda</Text>
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
          <Text style={styles.futureNoticeTitle}>Kelajakdagi kun yopiq</Text>
          <Text style={styles.futureNoticeText}>
            Bu sana hali kelmagan, shuning uchun inventar va savdo hisobi
            yaratilmaydi.
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
                {isFutureDate ? "Hali bu kun kelmadi" : "Mahsulotlar topilmadi"}
              </Text>
              <Text style={styles.emptySubtext}>
                {isFutureDate
                  ? "Kelajakdagi sana uchun inventar ochilmaydi"
                  : "Avval mahsulot qo&apos;shing"}
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
              <Text style={styles.cancelText}>Bekor</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isReadOnly ? "Ko&apos;rish rejimi" : "Ombor qoldig&apos;i"}
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalBody}>
            {selectedEntry ? (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>{selectedEntry.product.name}</Text>
                  <Text style={styles.infoText}>
                    Omborda faqat real qoldiq kiritiladi. Sotilgan miqdor
                    avtomatik hisoblanadi. Mahsulot kelsa, mahsulotlar
                    sahifasidan qoldiqni oshiring.
                  </Text>
                </View>

                {isReadOnly ? (
                  <View style={styles.readOnlyBox}>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Boshlang&apos;ich</Text>
                      <Text style={styles.previewValue}>{selectedEntry.startQuantity}</Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Joriy</Text>
                      <Text style={styles.previewValue}>{selectedEntry.currentQuantity}</Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Sotilgan</Text>
                      <Text style={styles.previewValue}>
                        {Math.max(
                          selectedEntry.startQuantity - selectedEntry.currentQuantity,
                          0,
                        )}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.label}>Boshlang&apos;ich miqdor</Text>
                    <View style={styles.readOnlyBox}>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Bugungi boshlang&apos;ich</Text>
                        <Text style={styles.previewValue}>{selectedEntry.startQuantity}</Text>
                      </View>
                      <Text style={styles.autoHint}>
                        Boshlang&apos;ich miqdor avtomatik. Uni ombordan
                        o&apos;zgartirib bo&apos;lmaydi.
                      </Text>
                    </View>

                    <Text style={styles.label}>Joriy miqdor</Text>
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
                      placeholderTextColor={COLORS.textTertiary}
                    />
                    {!!errors.currentQty && (
                      <Text style={styles.errorText}>{errors.currentQty}</Text>
                    )}

                    {preview ? (
                      <View style={styles.previewCard}>
                        <Text style={styles.previewTitle}>Saqlashdan oldingi tekshiruv</Text>

                        <View style={styles.warningBanner}>
                          <Text style={styles.warningBannerText}>
                            Omborda qoldiqni faqat kamaytirasiz. Mahsulot kelsa,
                            mahsulotlar sahifasidan qoldiqni ko&apos;paytiring.
                          </Text>
                        </View>

                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Avval sotilgan</Text>
                          <Text style={styles.previewValue}>{preview.previousSold}</Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Yangi sotilgan</Text>
                          <Text style={styles.previewValue}>{preview.nextSold}</Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Kutilgan tushum</Text>
                          <Text style={styles.previewValue}>
                            {formatMoney(preview.revenue)}
                          </Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Kutilgan foyda</Text>
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
                        <Text style={styles.errorBannerText}>{errors.general}</Text>
                      </View>
                    )}
                  </>
                )}
              </>
            ) : null}
          </ScrollView>

          {!isReadOnly ? (
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  dateNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
  },
  navButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonDisabled: {
    opacity: 0.55,
  },
  navButtonText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.primary,
    fontWeight: "600",
  },
  dateDisplay: { alignItems: "center", flex: 1 },
  dateText: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text },
  dayName: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  readOnlyBadge: {
    marginTop: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  readOnlyText: { fontSize: FONT_SIZE.xs, color: COLORS.text },
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
    borderBottomColor: COLORS.border,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  summaryValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    gap: SPACING.xs,
  },
  loadingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
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
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary },
  emptySubtext: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  productImage: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    resizeMode: "contain",
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
    color: COLORS.text,
  },
  productPrice: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  quantityBadge: {
    minWidth: 42,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  quantityBadgeLow: { backgroundColor: COLORS.danger },
  quantityBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
  },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  quantityItem: { alignItems: "center", flex: 1 },
  quantityLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  quantityValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  statValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  profit: { color: COLORS.secondary },
  loss: { color: COLORS.danger },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text },
  modalHeaderSpacer: { width: 60 },
  modalContent: { flex: 1 },
  modalBody: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  readOnlyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  autoHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    marginTop: -4,
    marginBottom: SPACING.sm,
    marginLeft: 2,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  previewTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  previewLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flex: 1 },
  previewValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
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
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
});
