import { useEffect, useState } from "react";
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

import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "../../src/constants";
import { useProductsScreenStore } from "../../src/store/selectors";
import type { Product } from "../../src/types";
import { formatMoney } from "../../src/utils/inventory";

export default function RestockScreen() {
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
      showToast("Noto'g'ri miqdor", "error");
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
      showToast(`${qtyToAdd} dona qo'shildi. Jami: ${newQuantity}`, "success");
    } catch (error: any) {
      showToast(error.message || "Qo'shishda xatolik", "error");
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
          <Image source={{ uri: item.image }} style={styles.img} />
        ) : (
          <View style={styles.noImgBox}>
            <Text style={styles.noImg}>Rasm yo'q</Text>
          </View>
        )}
      </View>

      <View style={styles.mainInfo}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.metaText}>Qoldiq: {item.quantity} dona</Text>
      </View>

      <View style={styles.priceCol}>
        <Text style={styles.price}>{formatMoney(item.buyPrice)}</Text>
        <Text style={styles.priceMuted}>Kelish</Text>
      </View>

      <View style={styles.priceCol}>
        <Text style={styles.price}>{formatMoney(item.sellPrice)}</Text>
        <Text style={styles.priceMuted}>Sotish</Text>
      </View>

      <View style={styles.restockBadge}>
        <Text style={styles.restockBadgeText}>+</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mahsulot qo'shish</Text>
        <Text style={styles.headerSubtitle}>
          Mahsulot kelganda qoldiqni yangilash uchun ro'yxatdan tanlang
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.localId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Mahsulotlar hali qo'shilmagan</Text>
        }
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
              <Text style={styles.backText}>Orqaga</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Mahsulot qo'shish</Text>
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
                      <Text style={styles.noImgLarge}>Rasm yo'q</Text>
                    </View>
                  )}
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>
                      {selectedProduct.name}
                    </Text>
                    <View style={styles.productMeta}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Hozirgi qoldiq</Text>
                        <Text style={styles.metaValue}>
                          {selectedProduct.quantity}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Muhim</Text>
                  <Text style={styles.infoText}>
                    Bu yerda faqat mahsulot miqdorini oshirasiz. Yangi kelgan
                    mahsulot miqdorini kiriting, tizim avtomatik ravishda umumiy
                    qoldiqni yangilaydi.
                  </Text>
                </View>

                <Text style={styles.label}>Qancha mahsulot keldi?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={(text) => {
                    setQuantity(text.replace(/\D/g, ""));
                  }}
                />

                {quantity && (
                  <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>Natija</Text>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Hozirgi qoldiq</Text>
                      <Text style={styles.previewValue}>
                        {selectedProduct.quantity}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Qo'shiladi</Text>
                      <Text style={[styles.previewValue, styles.addText]}>
                        +{quantity}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Yangi qoldiq</Text>
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
              style={[
                styles.saveButton,
                (!quantity || isSubmitting) && styles.saveButtonDisabled,
              ]}
              onPress={handleRestock}
              disabled={!quantity || isSubmitting}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "Qo'shilmoqda..." : "Qo'shish"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  list: { padding: SPACING.lg },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  imgBox: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  img: {
    width: "100%",
    height: "100%",
    borderRadius: BORDER_RADIUS.sm,
    resizeMode: "contain",
  },
  noImgBox: {
    width: "100%",
    height: "100%",
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  noImg: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  mainInfo: { flex: 1 },
  name: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.text },
  metaText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  priceCol: { width: 72, alignItems: "center" },
  price: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  priceMuted: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  restockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  restockBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    color: COLORS.textTertiary,
    marginTop: SPACING.xxxl,
  },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backText: { fontSize: FONT_SIZE.md, color: COLORS.primary },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  headerSpacer: { width: 60 },
  modalContent: { flex: 1 },
  modalBody: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  productInfo: {
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  noImgLarge: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  productDetails: { flex: 1, justifyContent: "center" },
  productName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
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
    color: COLORS.textTertiary,
  },
  metaValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
  },
  infoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  previewTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  previewValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
  },
  addText: { color: COLORS.secondary },
  totalText: { color: COLORS.primary, fontSize: FONT_SIZE.lg },
  modalFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  saveButton: {
    backgroundColor: COLORS.secondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
});
