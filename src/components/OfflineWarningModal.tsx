import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n";
import { useTheme } from "../store/themeStore";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function OfflineWarningModal({ visible, onClose }: Props) {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <Text style={[styles.icon, { color: colors.warning }]}>⚠️</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("offlineWarningTitle")}
          </Text>
          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t("offlineWarningBody")}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>
              {t("gotIt")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: SPACING.xl,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
  },
  icon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  bodyScroll: {
    maxHeight: 300,
    marginBottom: SPACING.xl,
  },
  body: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    width: "100%",
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
});
