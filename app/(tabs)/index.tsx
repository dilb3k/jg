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
import { formatMoney } from "../../src/utils/inventory";

export default function RestockScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { products, loadProducts, updateProduct, showToast } =
    useProductsScreenStore();

  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openRestockModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setQuantity("");
  };

  const handleRestock = async () => {
    if (!selectedProduct || !quantity) return;

    const qtyToAdd = parseInt(quantity.replace(/\D/g, ""), 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      showToast(t("error"), "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const newQuantity = selectedProduct.quantity + qtyToAdd;
      await updateProduct(selectedProduct.localId, {
        quantity: newQuantity,
      });
      await loadProducts();
      closeModal();
      showToast(`${qtyToAdd} ${t("stockAdded")} ${newQuantity}`, "success");
    } catch (error: any) {
      showToast(error.message || t("error"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openRestockModal(item)}
      activeOpacity={0.85}
    >
      <View style={styles.imgBox}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.img}
            resizeMode="contain"
          />
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
          {t("stockInfo", { quantity: item.quantity })}
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

      <View style={styles.restockBadge}>
        <Text style={styles.restockBadgeText}>+</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
            <Text style={styles.modalTitle}>{t("restock")}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="always"
          >
            {selectedProduct && (
              <>
                <View style={styles.productInfo}>
                  {selectedProduct.image ? (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: selectedProduct.image }}
                        style={styles.productImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <View style={styles.noImgBoxLarge}>
                      <Text style={styles.noImgLarge}>{t("noImage")}</Text>
                    </View>
                  )}
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>
                      {selectedProduct.name}
                    </Text>
                    <View style={styles.productMeta}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>
                          {t("currentStock")}
                        </Text>
                        <Text style={styles.metaValue}>
                          {selectedProduct.quantity}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text style={styles.label}>{t("howMuchArrived")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={(text) => {
                    setQuantity(text.replace(/\D/g, ""));
                  }}
                />

                {quantity && (
                  <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>{t("result")}</Text>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>
                        {t("currentStock")}
                      </Text>
                      <Text style={styles.previewValue}>
                        {selectedProduct.quantity}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>{t("addToStock")}</Text>
                      <Text style={[styles.previewValue, styles.addText]}>
                        +{quantity}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>{t("newStock")}</Text>
                      <Text style={[styles.previewValue, styles.totalText]}>
                        {selectedProduct.quantity + parseInt(quantity, 10)}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
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
            <Pressable
              style={[
                styles.saveButton,
                (!quantity || isSubmitting) && styles.saveButtonDisabled,
              ]}
              onPress={handleRestock}
              disabled={!quantity || isSubmitting}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? t("addingStock") : t("addStock")}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      padding: SPACING.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
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

    backText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#374151",
    },
    list: { padding: SPACING.lg },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
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
    priceCol: { width: 72, alignItems: "center" },
    price: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    priceMuted: { fontSize: FONT_SIZE.xs, color: colors.textSecondary },
    restockBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
    },
    restockBadgeText: {
      color: colors.white,
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
    },
    empty: {
      textAlign: "center",
      color: colors.textTertiary,
      marginTop: SPACING.xxxl,
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
    productInfo: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
    },
    imageContainer: {
      width: "100%",
      height: 200,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.md,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    productImage: {
      width: "100%",
      height: "100%",
      borderRadius: BORDER_RADIUS.md,
    },
    noImgBoxLarge: {
      width: 80,
      height: 80,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    noImgLarge: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
    },
    productDetails: { flex: 1, justifyContent: "center" },
    productName: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    productMeta: {
      flexDirection: "row",
      gap: SPACING.md,
    },
    metaItem: {
      gap: 2,
    },
    metaLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.textTertiary,
    },
    metaValue: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "600",
      color: colors.text,
    },
    infoCard: {
      backgroundColor: "#EFF6FF",
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    infoTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: SPACING.xs,
    },
    infoText: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
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
    previewTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    previewLabel: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
    },
    previewValue: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: colors.text,
    },
    addText: { color: colors.secondary },
    totalText: { color: colors.primary, fontSize: FONT_SIZE.lg },
    modalFooter: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      padding: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    saveButton: {
      backgroundColor: colors.secondary,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
    },
  });
