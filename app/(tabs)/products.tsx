import { useEffect, useMemo, useState } from "react";
import {
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
import * as ImagePicker from "expo-image-picker";
import { Trash2 } from "lucide-react-native";

import {
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  type ThemeColors,
} from "../../src/theme";
import { useProductsScreenStore } from "../../src/store/selectors";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import type { Product } from "../../src/types";
import {
  formatMoney,
  hasValidationErrors,
  normalizeDigits,
  validateProductInput,
} from "../../src/utils/inventory";

const EMPTY_FORM = {
  name: "",
  quantity: "",
  buyPrice: "",
  sellPrice: "",
  image: "",
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
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(
    null,
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const timeoutId = setTimeout(() => searchProducts(search), 300);
    return () => clearTimeout(timeoutId);
  }, [search, searchProducts]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors(EMPTY_ERRORS);
    setEditingProduct(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (!result.canceled) {
      setForm((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const validate = () => {
    const nextErrors = validateProductInput({
      name: form.name.trim(),
      quantity: Number(form.quantity || 0),
      buyPrice: Number(form.buyPrice),
      sellPrice: Number(form.sellPrice),
      image: form.image || undefined,
    });

    setErrors(nextErrors);
    return !hasValidationErrors(nextErrors);
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity || 0),
      buyPrice: Number(form.buyPrice),
      sellPrice: Number(form.sellPrice),
      image: form.image || undefined,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.localId, payload);
      } else {
        await createProduct(payload);
      }

      await loadProducts();
      closeModal();
      showToast(
        editingProduct ? t("productSaved") : t("productSaved"),
        "success",
      );
    } catch (error: any) {
      showToast(error.message || t("error"), "error");
    }
  };

  const openEdit = (item: Product) => {
    setEditingProduct(item);
    setErrors(EMPTY_ERRORS);
    setForm({
      name: item.name,
      quantity: String(item.quantity ?? ""),
      buyPrice: String(item.buyPrice ?? ""),
      sellPrice: String(item.sellPrice ?? ""),
      image: item.image ?? "",
    });
    setShowModal(true);
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.row} onPress={() => openEdit(item)}>
      <View style={styles.imgBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.img} />
        ) : (
          <View style={styles.noImgBox}>
            <Text style={styles.noImg}>{t("noImage")}</Text>
          </View>
        )}
      </View>

      <View style={styles.mainInfo}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.metaText}>
          {t("currentQuantity")}: {item.quantity}
        </Text>
      </View>

      <View style={styles.priceCol}>
        <Text style={styles.price}>{formatMoney(item.buyPrice)}</Text>
        <Text style={styles.priceMuted}>{t("buy")}</Text>
      </View>

      <View style={styles.priceCol}>
        <Text style={styles.price}>{formatMoney(item.sellPrice)}</Text>
        <Text style={styles.priceMuted}>{t("sell")}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          placeholder={t("search")}
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        <Pressable
          style={styles.add}
          onPressOut={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Text style={styles.addText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.localId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t("noProducts")}</Text>}
      />

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProduct ? t("editProduct") : t("addProduct")}
            </Text>
            {editingProduct ? (
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
                setForm((prev) => ({
                  ...prev,
                  buyPrice: normalizeDigits(text),
                }));
                setErrors((prev) => ({ ...prev, buyPrice: "" }));
              }}
              style={[styles.input, errors.buyPrice ? styles.inputError : null]}
            />
            {!!errors.buyPrice && (
              <Text style={styles.err}>{errors.buyPrice}</Text>
            )}

            <Text style={styles.label}>{t("sellPrice")}</Text>
            <TextInput
              placeholder={t("pricePlaceholder")}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={form.sellPrice}
              onChangeText={(text) => {
                setForm((prev) => ({
                  ...prev,
                  sellPrice: normalizeDigits(text),
                }));
                setErrors((prev) => ({ ...prev, sellPrice: "" }));
              }}
              style={[
                styles.input,
                errors.sellPrice ? styles.inputError : null,
              ]}
            />
            {!!errors.sellPrice && (
              <Text style={styles.err}>{errors.sellPrice}</Text>
            )}

            <Text style={styles.label}>{t("quantity")}</Text>
            <TextInput
              placeholder={t("quantityPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={form.quantity}
              onChangeText={(text) => {
                setForm((prev) => ({
                  ...prev,
                  quantity: normalizeDigits(text),
                }));
                setErrors((prev) => ({ ...prev, quantity: "" }));
              }}
              style={[styles.input, errors.quantity ? styles.inputError : null]}
            />
            {!!errors.quantity && (
              <Text style={styles.err}>{errors.quantity}</Text>
            )}

            <TouchableOpacity onPress={pickImage} style={styles.imgPicker}>
              {form.image ? (
                <Image
                  source={{ uri: form.image }}
                  style={styles.preview}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.imagePlaceholder}>{t("addImage")}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              onPress={closeModal}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
            >
              <Text style={styles.backText}>{t("back")}</Text>
            </Pressable>
            <Pressable onPressOut={handleSave} style={styles.save}>
              <Text style={styles.saveText}>{t("save")}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {deleteModalProduct ? (
        <Modal transparent onRequestClose={() => setDeleteModalProduct(null)}>
          <Pressable
            style={styles.overlay}
            onPress={() => setDeleteModalProduct(null)}
          >
            <Pressable
              style={styles.deleteModal}
              onPress={(event) => event.stopPropagation()}
            >
              <Text style={styles.deleteTitle}>{t("deleteConfirm")}</Text>
              <Text style={styles.deleteText}>{t("deleteMessage")}</Text>

              <View style={styles.deleteActions}>
                <TouchableOpacity
                  onPress={() => setDeleteModalProduct(null)}
                  style={styles.cancel}
                >
                  <Text style={styles.cancelText}>{t("cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    await deleteProduct(deleteModalProduct.localId);
                    await loadProducts();
                    closeModal();
                    setDeleteModalProduct(null);
                    showToast(t("productDeleted"), "success");
                  }}
                  style={styles.confirm}
                >
                  <Text style={styles.confirmText}>{t("delete")}</Text>
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
    header: { flexDirection: "row", padding: SPACING.lg, gap: SPACING.sm },
    search: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      color: colors.text,
    },
    add: {
      width: 44,
      height: 44,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: BORDER_RADIUS.md,
    },
    addText: { color: colors.white, fontSize: FONT_SIZE.xxl, lineHeight: 24 },
    list: { paddingBottom: SPACING.xl },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      gap: SPACING.sm,
    },
    imgBox: {
      width: 72,
      height: 72,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    img: {
      width: "100%",
      height: "100%",
      borderRadius: BORDER_RADIUS.sm,
    },
    noImgBox: {
      width: "100%",
      height: "100%",
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      padding: 4,
    },
    noImg: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
      textAlign: "center",
    },
    mainInfo: { flex: 1 },
    name: { fontSize: FONT_SIZE.md, fontWeight: "600", color: colors.text },
    metaText: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },
    priceCol: { width: 82, alignItems: "center" },
    price: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    priceMuted: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },
    empty: {
      textAlign: "center",
      color: colors.textTertiary,
      marginTop: SPACING.xxxl,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: "#F3F4F6",
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },

    backButtonPressed: {
      backgroundColor: "#E5E7EB",
      transform: [{ scale: 0.98 }],
    },
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
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      padding: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    warningCard: {
      backgroundColor: "#FFF7ED",
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      borderColor: "#FED7AA",
      gap: SPACING.xs,
    },
    warningTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: "#9A3412",
    },
    warningText: {
      fontSize: FONT_SIZE.sm,
      color: "#9A3412",
      lineHeight: 20,
    },
    label: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    input: {
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.sm,
      color: colors.text,
    },
    inputError: {
      borderWidth: 1,
      borderColor: colors.danger,
    },
    err: {
      color: colors.danger,
      fontSize: FONT_SIZE.sm,
      marginTop: -4,
      marginBottom: SPACING.sm,
      marginLeft: 2,
    },
    imgPicker: {
      height: 160,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      marginTop: SPACING.md,
      marginBottom: SPACING.xl,
      overflow: "hidden",
    },
    preview: { width: "100%", height: "100%" },
    imagePlaceholder: { color: colors.textSecondary, fontSize: FONT_SIZE.md },
    save: {
      backgroundColor: colors.secondary,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    saveText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: FONT_SIZE.md,
    },
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
    deleteTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    deleteText: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: SPACING.lg,
    },
    deleteActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: SPACING.sm,
    },
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
