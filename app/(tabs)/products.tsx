import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Package, Pencil, Plus, Trash2, Scan, X, Lock, Unlock } from "lucide-react-native";
import { BarcodeScannerModal } from "../../src/components/BarcodeScannerModal";

import {
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  type ThemeColors,
} from "../../src/theme";
import { useProductsScreenStore, useAuthStore } from "../../src/store/selectors";
import { useStore } from "../../src/store";
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
  barcodes: [] as string[],
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
  const userTier = user?.tier ?? "tekin";
  const productLimit = userTier === "bor" ? 100 : null;

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
  const [refreshing, setRefreshing] = useState(false);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Block code is managed in Settings. Here we only consume it to protect
  // editing. `unlocked` is a per-session flag toggled via the lock button.
  const blockCode = useStore((s) => s.blockCode);
  const [unlocked, setUnlocked] = useState(false);
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const pinActionRef = useRef<(() => void) | null>(null);
  const locked = !!blockCode && !unlocked;

  const findDuplicateBarcode = useCallback(
    (barcode: string, excludeId?: string) =>
      products.find((p) => p.barcodes?.includes(barcode) && p.localId !== excludeId),
    [products],
  );

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

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        const ia = a.displayIndex ?? 0;
        const ib = b.displayIndex ?? 0;
        return ia !== ib ? ia - ib : a.name.localeCompare(b.name);
      }),
    [products],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  }, [loadProducts]);

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

  // Ask for the block code, then run `action` on success. Used by the unlock
  // button and by saving an edited product while locked.
  const requirePin = (action: () => void) => {
    if (blockCode) {
      pinActionRef.current = action;
      setPinInput("");
      setPinError("");
      setShowPinVerify(true);
    } else {
      action();
    }
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
      barcodes: item.barcodes ?? [],
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

  const applyPickedImage = useCallback(
    (result: ImagePicker.ImagePickerResult) => {
      if (result.canceled) return;
      const file = result.assets[0];
      const mime = file.mimeType || "image/jpeg";
      const image = file.base64 ? `data:${mime};base64,${file.base64}` : "";
      if (image) setForm((prev) => ({ ...prev, image }));
    },
    [],
  );

  const captureFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast(t("cameraPermissionDesc"), "error");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.7,
      allowsEditing: true,
    });
    applyPickedImage(result);
  }, [applyPickedImage, showToast, t]);

  const pickFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.7,
    });
    applyPickedImage(result);
  }, [applyPickedImage]);

  const pickImage = useCallback(() => {
    Alert.alert(t("imageSourceTitle"), undefined, [
      { text: t("takePhoto"), onPress: () => void captureFromCamera() },
      { text: t("chooseFromGallery"), onPress: () => void pickFromGallery() },
      { text: t("cancel"), style: "cancel" },
    ]);
  }, [captureFromCamera, pickFromGallery, t]);

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

  const execSave = useCallback(async () => {
    const barcodes = form.barcodes.filter(Boolean);
    if (barcodes.length) {
      for (const code of barcodes) {
        const dup = findDuplicateBarcode(code, editingProduct?.localId);
        if (dup) {
          showToast(`"${dup.name}" allaqachon bu (${code}) barcode dan foydalanmoqda`, "error");
          return false;
        }
      }
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      quantity: Number(form.quantity || 0),
      buyPrice: parseFormattedAmount(form.buyPrice),
      sellPrice: parseFormattedAmount(form.sellPrice),
      barcodes,
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
      return true;
    } catch (error: any) {
      showToast(error.message || t("error"), "error");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [form, editingProduct, findDuplicateBarcode, showToast, updateProduct, createProduct, closeProductModal, t]);

  const handleSave = async () => {
    if (!canManageProducts) {
      showToast(t("premiumProductsLocked"), "error");
      return;
    }
    if (!validate()) return;

    // Block protection applies only when editing an existing product while the
    // screen is locked. Saving then asks for the code; creating is free.
    if (editingProduct && locked) {
      requirePin(() => execSave());
      return;
    }

    await execSave();
  };

  // Verifies the entered block code, then runs the pending gated action.
  // Errors render inline (not as a toast, which would sit behind the modal).
  const handleConfirmPin = () => {
    if (pinInput === blockCode) {
      setShowPinVerify(false);
      setPinInput("");
      setPinError("");
      const action = pinActionRef.current;
      pinActionRef.current = null;
      action?.();
    } else {
      setPinError(t("blockCodeWrong"));
      setPinInput("");
    }
  };

  const dismissPin = () => {
    setShowPinVerify(false);
    setPinError("");
  };

  // Shared PIN entry card. Rendered as an in-modal overlay while the product
  // form is open (avoids stacking two native modals, which freezes iOS), and
  // inside a standalone modal otherwise.
  const renderPinCard = () => (
    <Pressable style={[styles.blockCard, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
      <Lock size={32} color={colors.warning} />
      <Text style={[styles.blockTitle, { color: colors.text }]}>{t("enterBlockCode")}</Text>
      <Text style={[styles.blockDesc, { color: colors.textSecondary }]}>{t("unlockFormDesc")}</Text>
      <TextInput
        style={[styles.blockInput, { color: colors.text, borderColor: pinError ? colors.danger : colors.border, backgroundColor: colors.surfaceSecondary }]}
        placeholder="0000"
        placeholderTextColor={colors.textTertiary}
        keyboardType="number-pad"
        maxLength={4}
        value={pinInput}
        onChangeText={(v) => { setPinInput(v.replace(/\D/g, "")); if (pinError) setPinError(""); }}
        autoFocus
      />
      {pinError ? (
        <Text style={{ color: colors.danger, fontSize: FONT_SIZE.sm, fontWeight: "600" }}>{pinError}</Text>
      ) : null}
      <View style={styles.blockActions}>
        <TouchableOpacity style={[styles.blockBtnAction, { backgroundColor: colors.surfaceSecondary, flex: 1 }]} onPress={dismissPin}>
          <Text style={[styles.blockBtnText, { color: colors.text }]}>{t("cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.blockBtnAction, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleConfirmPin}>
          <Text style={styles.blockBtnText}>{t("confirm")}</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );

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
          containerStyle={{ flex: 1 }}
        />
        <Pressable
          style={[
            styles.blockBtn,
            { backgroundColor: locked ? colors.warning + "20" : colors.surfaceSecondary, borderColor: locked ? colors.warning : colors.border },
          ]}
          onPress={() => {
            // No code yet → direct the user to Settings to set one.
            if (!blockCode) {
              showToast(t("setBlockCodeInSettings"), "info");
              return;
            }
            // Locking needs no code; unlocking asks for the block code.
            if (unlocked) {
              setUnlocked(false);
            } else {
              requirePin(() => setUnlocked(true));
            }
          }}
        >
          {locked ? (
            <Lock size={18} color={colors.warning} />
          ) : (
            <Unlock size={18} color={colors.textTertiary} />
          )}
        </Pressable>
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

      {productLimit !== null ? (
        <View style={[styles.limitBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.limitBarInner}>
            <View style={[styles.limitFill, { width: `${Math.min((products.length / productLimit) * 100, 100)}%`, backgroundColor: products.length >= productLimit ? colors.danger : colors.primary }]} />
          </View>
          <Text style={[styles.limitText, { color: products.length >= productLimit ? colors.danger : colors.textSecondary }]}>
            {t("productsUsed", { count: products.length, limit: productLimit })}
          </Text>
        </View>
      ) : null}

      {isListLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sortedProducts}
          keyExtractor={(item) => item.localId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={11}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
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
                  {previewBuy > 0 && (
                    <View style={styles.costPreviewRow}>
                      <Text style={styles.costPreviewLabel}>{t("buyPrice")}</Text>
                      <Text style={styles.costPreviewValue}>
                        {formatMoney(previewBuy)}
                      </Text>
                    </View>
                  )}
                  {previewSell > 0 && (
                    <View style={styles.costPreviewRow}>
                      <Text style={styles.costPreviewLabel}>{t("sellPrice")}</Text>
                      <Text style={styles.costPreviewValue}>
                        {formatMoney(previewSell)}
                      </Text>
                    </View>
                  )}
                  {previewSell > 0 && previewBuy > 0 && (
                    <View style={styles.costPreviewRow}>
                      <Text style={styles.costPreviewLabel}>{t("profitPerUnit")}</Text>
                      <Text style={[styles.costPreviewValue, { color: colors.secondary }]}>
                        {formatMoney(previewSell - previewBuy)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.costPreviewDivider} />
                  {previewQty > 0 && (
                    <View style={styles.costPreviewRow}>
                      <Text style={styles.costPreviewLabel}>{t("totalRevenueLabelShort")}</Text>
                      <Text style={styles.costPreviewValue}>
                        {formatMoney(previewQty * previewSell)}
                      </Text>
                    </View>
                  )}
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
                  {previewSell > 0 && previewBuy > 0 && previewQty > 0 && (
                    <View style={styles.costPreviewRow}>
                      <Text style={styles.costPreviewLabel}>{t("profitMarginPercent")}</Text>
                      <Text style={[styles.costPreviewValue, { color: colors.secondary }]}>
                        {((previewSell - previewBuy) / previewSell * 100).toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              )}

            <TouchableOpacity onPress={pickImage} style={styles.imgPicker}>
              {form.image ? (
                <Image source={{ uri: form.image }} style={styles.preview} resizeMode="contain" />
              ) : (
                <Text style={styles.imagePlaceholder}>{t("addImage")}</Text>
              )}
            </TouchableOpacity>

            <View style={[styles.barcodeSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.barcodeHeader}>
                <Scan size={20} color={colors.primary} />
                <Text style={[styles.barcodeLabel, { color: colors.textSecondary }]}>{t("barcodes")}</Text>
                <TouchableOpacity
                  style={[styles.barcodeAddBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setShowBarcodeScanner(true)}
                >
                  <Plus size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
              {form.barcodes.length > 0 ? (
                <View style={styles.barcodeList}>
                  {form.barcodes.map((code, index) => (
                    <View key={index} style={[styles.barcodeChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                      <Text style={[styles.barcodeChipText, { color: colors.text }]}>{code}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setForm((prev) => ({
                            ...prev,
                            barcodes: prev.barcodes.filter((_, i) => i !== index),
                          }));
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <X size={14} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.barcodePlaceholder, { color: colors.textTertiary }]}>
                  Barcode ni skaner qilish
                </Text>
              )}
            </View>
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

          {/* In-modal PIN overlay (saving an edit while locked) — avoids a
              second native modal which freezes iOS. */}
          {showPinVerify && (
            <Pressable
              style={[styles.pinOverlay, { backgroundColor: colors.overlay }]}
              onPress={dismissPin}
            >
              {renderPinCard()}
            </Pressable>
          )}
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
                    <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
                    {restockProduct.buyPrice > 0 && (
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>{t("restockCost")}</Text>
                        <Text style={styles.previewValue}>
                          {formatMoney(parseInt(restockQty || "0", 10) * restockProduct.buyPrice)}
                        </Text>
                      </View>
                    )}
                    {restockProduct.buyPrice > 0 && restockProduct.sellPrice > 0 && (
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>{t("expectedProfitAmount")}</Text>
                        <Text style={[styles.previewValue, { color: colors.secondary }]}>
                          {formatMoney(
                            parseInt(restockQty || "0", 10) *
                              (restockProduct.sellPrice - restockProduct.buyPrice),
                          )}
                        </Text>
                      </View>
                    )}
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

      {showBarcodeScanner && (
        <BarcodeScannerModal
          visible
          manualCapture
          onClose={() => setShowBarcodeScanner(false)}
          onBarcodeDetected={(data) => {
            setForm((prev) => ({
              ...prev,
              barcodes: prev.barcodes.includes(data) ? prev.barcodes : [...prev.barcodes, data],
            }));
            setShowBarcodeScanner(false);
          }}
          conflictCheck={(barcode, onResult) => {
            const dup = findDuplicateBarcode(barcode, editingProduct?.localId);
            if (dup) {
              onResult({ conflictName: dup.name });
            } else {
              onResult(null);
            }
          }}
          colors={colors}
          message="Barcode ni ramka ichiga joylashtiring"
        />
      )}

      {/* Standalone PIN modal — only when the product form is closed (e.g.
          unlocking via the lock button). The edit-save case is handled by the
          in-modal overlay above to avoid stacking two native modals on iOS. */}
      <Modal
        visible={showPinVerify && !showProductModal}
        transparent
        animationType="fade"
        onRequestClose={dismissPin}
      >
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={dismissPin}>
          {renderPinCard()}
        </Pressable>
      </Modal>
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
      width: 48,
      height: 48,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: BORDER_RADIUS.lg,
      boxShadow: "0px 4px 12px rgba(139, 92, 246, 0.35)",
      elevation: 4,
    },
    addBtnDisabled: { opacity: 0.45 },

    premiumBanner: {
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
    },
    premiumBannerText: { fontSize: FONT_SIZE.sm, fontWeight: "600", textAlign: "center" },

    limitBar: {
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    limitBarInner: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    limitFill: {
      height: "100%",
      borderRadius: 3,
    },
    limitText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },

    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

    list: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xxxl,
    },

    row: {
      backgroundColor: colors.surface,
      marginBottom: SPACING.sm,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 0.5,
      borderColor: colors.border,
      overflow: "hidden",
      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
      elevation: 2,
    },
    rowMain: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    imgBox: {
      width: 52,
      height: 52,
      borderRadius: BORDER_RADIUS.lg,
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
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    priceCol: { width: 72, alignItems: "center" },
    price: { fontSize: FONT_SIZE.xs, fontWeight: "700", color: colors.text },
    priceMuted: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },

    rowActions: {
      flexDirection: "row",
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },

    editBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.xs,
      paddingVertical: SPACING.md,
      backgroundColor: colors.surfaceSecondary,
      borderRightWidth: 0.5,
      borderRightColor: colors.border,
    },
    editBtnDisabled: { opacity: 0.5 },
    actionBtnLabel: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "600",
    },

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

    emptyContainer: { alignItems: "center", marginTop: SPACING.xxxl, marginBottom: SPACING.xxxl },
    empty: { textAlign: "center", color: colors.textTertiary, marginTop: SPACING.md },
    costPreview: {
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 0.5,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    costPreviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    costPreviewLabel: { fontSize: FONT_SIZE.sm, color: colors.textSecondary },
    costPreviewValue: { fontSize: FONT_SIZE.md, fontWeight: "700", color: colors.text },
    costPreviewDivider: { height: 1, backgroundColor: colors.border, marginVertical: SPACING.xs },
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
    modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: colors.text },
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
      paddingBottom: SPACING.xl,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      gap: SPACING.md,
    },
    backButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 0.5,
      borderColor: colors.border,
      alignItems: "center",
    },
    label: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: colors.textSecondary, marginBottom: SPACING.xs },
    input: {
      backgroundColor: colors.surfaceSecondary,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      marginBottom: SPACING.sm,
      color: colors.text,
      borderWidth: 0.5,
      borderColor: colors.border,
      fontSize: FONT_SIZE.md,
    },
    inputError: { borderWidth: 1, borderColor: colors.danger },
    err: { color: colors.danger, fontSize: FONT_SIZE.sm, marginTop: -4, marginBottom: SPACING.sm },
    imgPicker: {
      height: 160,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: BORDER_RADIUS.lg,
      marginTop: SPACING.md,
      overflow: "hidden",
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    preview: { width: "100%", height: "100%" },
    imagePlaceholder: { color: colors.textSecondary, fontSize: FONT_SIZE.md },
    save: {
      flex: 1,
      backgroundColor: colors.secondary,
      paddingVertical: 14,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
      boxShadow: "0px 4px 12px rgba(16, 185, 129, 0.3)",
      elevation: 3,
    },
    saveRestock: {
      flex: 1,
      backgroundColor: colors.secondary,
      paddingVertical: 14,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
      boxShadow: "0px 4px 12px rgba(16, 185, 129, 0.3)",
      elevation: 3,
    },
    saveDisabled: { opacity: 0.5 },
    saveText: { color: colors.white, fontWeight: "700", fontSize: FONT_SIZE.md },
    restockInfoCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    restockImage: { width: "100%", height: 160, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md },
    restockNoImage: {
      height: 100,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    restockName: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: colors.text },
    restockPrices: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginTop: SPACING.xs },
    restockCurrent: { fontSize: FONT_SIZE.md, fontWeight: "600", color: colors.text, marginTop: SPACING.sm },
    restockInput: {
      backgroundColor: colors.surfaceSecondary,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
      color: colors.text,
      marginBottom: SPACING.lg,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      gap: SPACING.sm,
      borderWidth: 0.5,
      borderColor: colors.border,
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
      padding: SPACING.xl,
    },
    pinOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.xl,
      zIndex: 100,
    },
    deleteModal: {
      backgroundColor: colors.surface,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      width: "100%",
      maxWidth: 340,
    },
    deleteTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: colors.text, marginBottom: SPACING.sm },
    deleteText: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: SPACING.lg, lineHeight: 20 },
    deleteActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },
    cancel: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.surfaceSecondary,
    },
    cancelText: { color: colors.text, fontWeight: "600" },
    confirm: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.danger,
    },
    confirmText: { color: colors.white, fontWeight: "700" },

    barcodeSection: {
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 0.5,
      marginTop: SPACING.md,
    },
    barcodeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    barcodeLabel: { fontSize: FONT_SIZE.sm, fontWeight: "600", flex: 1 },
    barcodeAddBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    barcodeList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.xs,
      marginTop: SPACING.sm,
    },
    barcodeChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 0.5,
    },
    barcodeChipText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    barcodePlaceholder: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },

    blockBtn: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.lg,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 0.5,
    },
    blockCard: {
      width: "100%",
      maxWidth: 320,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.xl,
      alignItems: "center",
      gap: SPACING.md,
    },
    blockTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", textAlign: "center" },
    blockDesc: { fontSize: FONT_SIZE.sm, textAlign: "center", lineHeight: 20 },
    blockInput: {
      width: "100%",
      textAlign: "center",
      fontSize: FONT_SIZE.lg,
      fontWeight: "600",
      letterSpacing: 2,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 0.5,
    },
    blockActions: {
      flexDirection: "row",
      gap: SPACING.sm,
      width: "100%",
      marginTop: SPACING.sm,
    },
    blockBtnAction: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
    },
    blockBtnText: { color: "#ffffff", fontWeight: "700", fontSize: FONT_SIZE.md },
  });