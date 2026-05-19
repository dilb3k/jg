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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Package, Pencil, Plus, Trash2 } from "lucide-react-native";

import {
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  type ThemeColors,
} from "../../src/theme";
import { useProductsScreenStore, useAuthStore } from "../../src/store/selectors";
import { SearchInputWithClear } from "../../src/components/SearchInputWithClear";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import type { Product, ProductInput } from "../../src/types";
import {
  formatMoney,
  hasValidationErrors,
  normalizeDigits,
  validateProductInput,
  formatInputAmount,
  parseFormattedAmount,
} from "../../src/utils/inventory";

const EMPTY_FORM = {
  name: "",
  quantity: "",
  buyPrice: "",
  sellPrice: "",
  image: undefined as string | undefined,
};

const EMPTY_ERRORS = {
  name: "",
  buyPrice: "",
  sellPrice: "",
  quantity: "",
};

export default function ProductsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
  const isPayed = isSuperAdmin || (user?.isPayed ?? false);
  const canManageProducts = isPayed;

  const {
    products,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    showToast,
  } = useProductsScreenStore();

  const [search, setSearch] = useState("");
  const [isListLoading, setIsListLoading] = useState(products.length === 0);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [isRestocking, setIsRestocking] = useState(false);

  const previewQty = Number(form.quantity || 0);
  const previewBuy = parseFormattedAmount(form.buyPrice);
  const previewSell = parseFormattedAmount(form.sellPrice);
  const previewTotalCost = previewQty * previewBuy;
  const previewExpectedProfit = previewQty * (previewSell - previewBuy);

  useEffect(() => {
    const timeoutId = setTimeout(() => searchProducts(search), 300);
    return () => clearTimeout(timeoutId);
  }, [search, searchProducts]);

  useEffect(() => {
    if (products.length === 0) {
      setIsListLoading(true);
      loadProducts().finally(() => setIsListLoading(false));
    } else {
      setIsListLoading(false);
    }
  }, [loadProducts, products.length]);

  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: "Tugagan", color: colors.danger };
    if (qty <= 5) return { label: "Kam", color: colors.warning };
    return { label: "Mavjud", color: colors.success };
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors(EMPTY_ERRORS);
    setEditingProduct(null);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    resetForm();
  };

  const openRestock = (product: Product) => {
    setRestockProduct(product);
    setRestockQty("");
    setShowRestockModal(true);
  };

  const closeRestockModal = () => {
    setShowRestockModal(false);
    setRestockProduct(null);
    setRestockQty("");
  };

  const openEdit = (item: Product) => {
    if (!canManageProducts) {
      showToast(t("premiumProductsLocked"), "info");
      return;
    }
    setEditingProduct(item);
    setErrors(EMPTY_ERRORS);
    setForm({
      name: item.name,
      quantity: String(item.quantity ?? ""),
      buyPrice: item.buyPrice ? formatInputAmount(String(item.buyPrice)) : "",
      sellPrice: item.sellPrice ? formatInputAmount(String(item.sellPrice)) : "",
      image: item.image,
    });
    setShowProductModal(true);
  };

  const openCreate = () => {
    if (!canManageProducts) {
      showToast(t("premiumProductsLocked"), "info");
      return;
    }
    resetForm();
    setShowProductModal(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      const mime = file.mimeType || "image/jpeg";
      const image = file.base64 ? `data:${mime};base64,${file.base64}` : "";
      setForm((prev) => ({ ...prev, image }));
    }
  };

  const validate = () => {
    const nextErrors = validateProductInput({
      name: form.name.trim(),
      quantity: Number(form.quantity || 0),
      buyPrice: parseFormattedAmount(form.buyPrice),
      sellPrice: parseFormattedAmount(form.sellPrice),
    });
    setErrors(nextErrors);
    return !hasValidationErrors(nextErrors);
  };

  const handleSave = async () => {
    if (!canManageProducts) {
      showToast(t("premiumProductsLocked"), "error");
      return;
    }
    if (!validate()) return;

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      quantity: Number(form.quantity || 0),
      buyPrice: parseFormattedAmount(form.buyPrice),
      sellPrice: parseFormattedAmount(form.sellPrice),
    };

    if (form.image !== undefined && form.image !== editingProduct?.image) {
      payload.image = form.image;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.localId, payload);
      } else {
        await createProduct(payload as ProductInput);
      }
      closeProductModal();
      showToast(t("productSaved"), "success");
    } catch (error: any) {
      showToast(error.message || t("error"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestock = async () => {
    if (!restockProduct || !restockQty) return;
    const qtyToAdd = parseInt(restockQty.replace(/\D/g, ""), 10);
    if (Number.isNaN(qtyToAdd) || qtyToAdd <= 0) {
      showToast(t("enterValidQuantity"), "error");
      return;
    }
    setIsRestocking(true);
    try {
      const newQuantity = restockProduct.quantity + qtyToAdd;
      await updateProduct(restockProduct.localId, { quantity: newQuantity });
      closeRestockModal();
      showToast(`${qtyToAdd} ${t("stockAdded")} → ${newQuantity}`, "success");
    } catch (error: any) {
      showToast(error.message || t("error"), "error");
    } finally {
      setIsRestocking(false);
    }
  };

  // ✅ FIX: Entire row is pressable → opens edit.
  //         rowActions now has: [Edit btn] [Plus/Restock btn] — edit on left, plus on right.
  const renderItem = ({ item }: { item: Product }) => {
    const status = getStockStatus(item.quantity);
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openEdit(item)}
        activeOpacity={0.75}
      >
        <View style={styles.rowMain}>
          <View style={styles.imgBox}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.img} />
            ) : (
              <View style={styles.noImgBox}>
                <Package size={22} color={colors.textTertiary} />
              </View>
            )}
          </View>

          <View style={styles.mainInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.metaText}>
              {item.displayIndex && item.displayIndex > 0 ? `#${item.displayIndex} · ` : ""}
              {t("currentQuantity")}: {item.quantity}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.priceCol}>
            <Text style={styles.price}>{formatMoney(item.buyPrice)}</Text>
            <Text style={styles.priceMuted}>{t("buy")}</Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={styles.price}>{formatMoney(item.sellPrice)}</Text>
            <Text style={styles.priceMuted}>{t("sell")}</Text>
          </View>
        </View>

        {/* ✅ FIX: Edit button on left, Restock/Plus button on right */}
        <View style={styles.rowActions}>
          {/* Edit — stops propagation so row's onPress doesn't also fire */}
          <TouchableOpacity
            style={[styles.editBtn, !canManageProducts && styles.editBtnDisabled]}
            onPress={(e) => {
              e.stopPropagation?.();
              openEdit(item);
            }}
            accessibilityLabel={t("editProduct")}
          >
            <Pencil size={18} color={canManageProducts ? colors.primary : colors.textTertiary} />
            <Text style={[styles.actionBtnLabel, { color: canManageProducts ? colors.primary : colors.textTertiary }]}>
              {t("edit")}
            </Text>
          </TouchableOpacity>

          {/* Restock / Plus */}
          <TouchableOpacity
            style={styles.restockBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              openRestock(item);
            }}
            accessibilityLabel={t("restock")}
          >
            <Plus size={20} color={colors.white} />
            <Text style={styles.restockBtnLabel}>{t("add")}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchInputWithClear
          colors={colors}
          placeholder={t("search")}
          value={search}
          onChangeText={setSearch}
        />
        <Pressable
          style={[styles.addBtn, !canManageProducts && styles.addBtnDisabled]}
          onPress={openCreate}
        >
          <Plus size={22} color={colors.white} />
        </Pressable>
      </View>

      {!canManageProducts ? (
        <View
          style={[
            styles.premiumBanner,
            { backgroundColor: colors.warning + "18", borderColor: colors.warning },
          ]}
        >
          <Text style={[styles.premiumBannerText, { color: colors.warning }]}>
            {t("premiumProductsLocked")}
          </Text>
        </View>
      ) : null}

      {isListLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.localId}
          renderItem={renderItem}
          // ✅ FIX: padding is inside list content, not on the screen edges
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color={colors.textTertiary} />
              <Text style={styles.empty}>{t("noProducts")}</Text>
            </View>
          }
        />
      )}

      {/* Create / edit product */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeProductModal}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeProductModal}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProduct ? t("editProduct") : t("addProduct")}
            </Text>
            {editingProduct && canManageProducts ? (
              <TouchableOpacity
                style={styles.headerDeleteBtn}
                onPress={() => setDeleteModalProduct(editingProduct)}
              >
                <Trash2 size={18} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>

          <ScrollView
            style={styles.modal}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="always"
          >
            <Text style={styles.label}>{t("productName")}</Text>
            <TextInput
              placeholder={t("productNamePlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={form.name}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, name: text }));
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              style={[styles.input, errors.name ? styles.inputError : null]}
            />
            {!!errors.name && <Text style={styles.err}>{errors.name}</Text>}

            <Text style={styles.label}>{t("buyPrice")}</Text>
            <TextInput
              placeholder={t("pricePlaceholder")}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={form.buyPrice}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, buyPrice: formatInputAmount(text) }));
                setErrors((prev) => ({ ...prev, buyPrice: "" }));
              }}
              style={[styles.input, errors.buyPrice ? styles.inputError : null]}
            />
            {!!errors.buyPrice && <Text style={styles.err}>{errors.buyPrice}</Text>}

            <Text style={styles.label}>{t("sellPrice")}</Text>
            <TextInput
              placeholder={t("pricePlaceholder")}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={form.sellPrice}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, sellPrice: formatInputAmount(text) }));
                setErrors((prev) => ({ ...prev, sellPrice: "" }));
              }}
              style={[styles.input, errors.sellPrice ? styles.inputError : null]}
            />
            {!!errors.sellPrice && <Text style={styles.err}>{errors.sellPrice}</Text>}

            <Text style={styles.label}>{t("quantity")}</Text>
            <TextInput
              placeholder={t("quantityPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={form.quantity}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, quantity: normalizeDigits(text) }));
                setErrors((prev) => ({ ...prev, quantity: "" }));
              }}
              style={[styles.input, errors.quantity ? styles.inputError : null]}
            />
            {!!errors.quantity && <Text style={styles.err}>{errors.quantity}</Text>}

            {!editingProduct &&
              (previewQty > 0 || previewBuy > 0 || previewSell > 0) && (
                <View
                  style={[
                    styles.costPreview,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.costPreviewRow}>
                    <Text style={styles.costPreviewLabel}>{t("totalProductCost")}</Text>
                    <Text style={styles.costPreviewValue}>{formatMoney(previewTotalCost)}</Text>
                  </View>
                  <View style={styles.costPreviewRow}>
                    <Text style={styles.costPreviewLabel}>{t("expectedProfitAmount")}</Text>
                    <Text
                      style={[
                        styles.costPreviewValue,
                        {
                          color:
                            previewExpectedProfit >= 0 ? colors.secondary : colors.danger,
                        },
                      ]}
                    >
                      {formatMoney(previewExpectedProfit)}
                    </Text>
                  </View>
                </View>
              )}

            <TouchableOpacity onPress={pickImage} style={styles.imgPicker}>
              {form.image ? (
                <Image source={{ uri: form.image }} style={styles.preview} resizeMode="contain" />
              ) : (
                <Text style={styles.imagePlaceholder}>{t("addImage")}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={closeProductModal} style={styles.backButton}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Pressable
              onPressOut={handleSave}
              style={[styles.save, !canManageProducts && styles.saveDisabled]}
              disabled={isSubmitting || !canManageProducts}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveText}>{t("save")}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Restock / add quantity */}
      <Modal
        visible={showRestockModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeRestockModal}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeRestockModal}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("restock")}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="always"
          >
            {restockProduct && (
              <>
                <View style={styles.restockInfoCard}>
                  {restockProduct.image ? (
                    <Image
                      source={{ uri: restockProduct.image }}
                      style={styles.restockImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.restockNoImage}>
                      <Package size={32} color={colors.textTertiary} />
                    </View>
                  )}
                  <Text style={styles.restockName}>{restockProduct.name}</Text>
                  <Text style={styles.restockPrices}>
                    {t("buy")}: {formatMoney(restockProduct.buyPrice)} | {t("sell")}:{" "}
                    {formatMoney(restockProduct.sellPrice)}
                  </Text>
                  <Text style={styles.restockCurrent}>
                    {t("currentStock")}: {restockProduct.quantity}
                  </Text>
                </View>

                <Text style={styles.label}>{t("howMuchArrived")}</Text>
                <TextInput
                  style={styles.restockInput}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={restockQty}
                  onChangeText={(text) => setRestockQty(text.replace(/\D/g, ""))}
                />

                {restockQty ? (
                  <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>{t("result")}</Text>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>{t("currentStock")}</Text>
                      <Text style={styles.previewValue}>{restockProduct.quantity}</Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>{t("addToStock")}</Text>
                      <Text style={[styles.previewValue, { color: colors.secondary }]}>
                        +{restockQty}
                      </Text>
                    </View>
                    <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>{t("newStock")}</Text>
                      <Text style={[styles.previewValue, { color: colors.primary }]}>
                        {restockProduct.quantity + parseInt(restockQty || "0", 10)}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={closeRestockModal} style={styles.backButton}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Pressable
              style={[styles.saveRestock, (!restockQty || isRestocking) && styles.saveDisabled]}
              onPress={handleRestock}
              disabled={!restockQty || isRestocking}
            >
              {isRestocking ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveText}>{t("addStock")}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {deleteModalProduct ? (
        <Modal transparent onRequestClose={() => setDeleteModalProduct(null)}>
          <Pressable style={styles.overlay} onPress={() => setDeleteModalProduct(null)}>
            <Pressable style={styles.deleteModal} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.deleteTitle}>{t("deleteConfirm")}</Text>
              <Text style={styles.deleteText}>{t("deleteMessage")}</Text>
              <View style={styles.deleteActions}>
                <TouchableOpacity onPress={() => setDeleteModalProduct(null)} style={styles.cancel}>
                  <Text style={styles.cancelText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    if (!canManageProducts) {
                      showToast(t("premiumProductsLocked"), "error");
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteProduct(deleteModalProduct.localId);
                      closeProductModal();
                      setDeleteModalProduct(null);
                      showToast(t("productDeleted"), "success");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  style={styles.confirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.confirmText}>{t("delete")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.lg,
      gap: SPACING.sm,
    },
    addBtn: {
      width: 44,
      height: 44,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: BORDER_RADIUS.md,
    },
    addBtnDisabled: { opacity: 0.45 },

    premiumBanner: {
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
    },
    premiumBannerText: { fontSize: FONT_SIZE.sm, fontWeight: "600", textAlign: "center" },

    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: SPACING.md, color: colors.textSecondary, fontSize: FONT_SIZE.md },

    list: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xxxl,
    },

    row: {
      backgroundColor: colors.surface,
      marginBottom: SPACING.sm,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    rowMain: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    imgBox: {
      width: 56,
      height: 56,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    img: { width: "100%", height: "100%" },
    noImgBox: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
    mainInfo: { flex: 1, minWidth: 0 },
    name: { fontSize: FONT_SIZE.md, fontWeight: "600", color: colors.text },
    metaText: { fontSize: FONT_SIZE.xs, color: colors.textSecondary, marginTop: 2 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: "500" },
    priceCol: { width: 72, alignItems: "center" },
    price: { fontSize: FONT_SIZE.xs, fontWeight: "700", color: colors.text },
    priceMuted: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },

    // ✅ FIX: rowActions — Edit on LEFT, Plus/Restock on RIGHT
    rowActions: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    // ✅ FIX: editBtn now flex:1 on left side, with label text
    editBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.xs,
      paddingVertical: SPACING.md,
      backgroundColor: colors.surfaceSecondary,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    editBtnDisabled: { opacity: 0.5 },
    actionBtnLabel: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "600",
    },

    // ✅ FIX: restockBtn is now flex:1 on the right side
    restockBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.xs,
      paddingVertical: SPACING.md,
      backgroundColor: colors.secondary,
    },
    restockBtnLabel: { color: colors.white, fontWeight: "700", fontSize: FONT_SIZE.sm },

    emptyContainer: { alignItems: "center", marginTop: SPACING.xxxl },
    empty: { textAlign: "center", color: colors.textTertiary, marginTop: SPACING.md },
    costPreview: {
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    costPreviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    costPreviewLabel: { fontSize: FONT_SIZE.sm, color: colors.textSecondary },
    costPreviewValue: { fontSize: FONT_SIZE.md, fontWeight: "700", color: colors.text },
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
    modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: "600", color: colors.text },
    headerSpacer: { width: 60 },
    headerDeleteBtn: {
      width: 36,
      height: 36,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.danger,
      justifyContent: "center",
      alignItems: "center",
    },
    modal: { flex: 1 },
    modalBody: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
    modalFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: SPACING.xs },
    input: {
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.sm,
      color: colors.text,
    },
    inputError: { borderWidth: 1, borderColor: colors.danger },
    err: { color: colors.danger, fontSize: FONT_SIZE.sm, marginTop: -4, marginBottom: SPACING.sm },
    imgPicker: {
      height: 160,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      marginTop: SPACING.md,
      overflow: "hidden",
    },
    preview: { width: "100%", height: "100%" },
    imagePlaceholder: { color: colors.textSecondary, fontSize: FONT_SIZE.md },
    save: {
      backgroundColor: colors.secondary,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
      minWidth: 120,
    },
    saveRestock: {
      backgroundColor: colors.secondary,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
      minWidth: 140,
    },
    saveDisabled: { opacity: 0.6 },
    saveText: { color: colors.white, fontWeight: "700", fontSize: FONT_SIZE.md },
    restockInfoCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
    },
    restockImage: { width: "100%", height: 160, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md },
    restockNoImage: {
      height: 100,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    restockName: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: colors.text },
    restockPrices: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginTop: SPACING.xs },
    restockCurrent: { fontSize: FONT_SIZE.md, fontWeight: "600", color: colors.text, marginTop: SPACING.sm },
    restockInput: {
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
      color: colors.text,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    previewTitle: { fontSize: FONT_SIZE.md, fontWeight: "700", color: colors.text },
    previewDivider: { height: 1, marginVertical: SPACING.xs },
    previewRow: { flexDirection: "row", justifyContent: "space-between" },
    previewLabel: { fontSize: FONT_SIZE.sm, color: colors.textSecondary },
    previewValue: { fontSize: FONT_SIZE.md, fontWeight: "700", color: colors.text },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.lg,
    },
    deleteModal: {
      backgroundColor: colors.surface,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      width: "100%",
      maxWidth: 360,
    },
    deleteTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: colors.text, marginBottom: SPACING.sm },
    deleteText: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: SPACING.lg },
    deleteActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },
    cancel: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.surfaceSecondary,
    },
    cancelText: { color: colors.text, fontWeight: "600" },
    confirm: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.danger,
    },
    confirmText: { color: colors.white, fontWeight: "700" },
  });