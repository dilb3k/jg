import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { useRouter } from "expo-router";

import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "../src/constants";
import { useAuthStore } from "../src/store/selectors";
import { apiClient } from "../src/api/client";
import type { AuthUser } from "../src/types";

export default function AdminsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [admins, setAdmins] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Only superAdmin can access this page
    if (user?.role !== "superAdmin") {
      router.replace("/(tabs)");
      return;
    }
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdmins();
      setAdmins(data);
    } catch (err: any) {
      setError(err.message || "Adminlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Login va parolni kiriting");
      return;
    }

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await apiClient.createAdmin(username.trim(), password);
      setShowModal(false);
      setUsername("");
      setPassword("");
      loadAdmins();
    } catch (err: any) {
      setError(err.message || "Admin yaratishda xatolik");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superAdmin":
        return "Super Admin";
      case "admin":
        return "Admin";
      default:
        return role;
    }
  };

  if (user?.role !== "superAdmin") {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adminlar</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Yuklanmoqda...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={admins}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.adminCard}>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>{item.username}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
                  </View>
                  <Text style={styles.adminDate}>
                    Yaratilgan: {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.list}
          />

          <View style={styles.footer}>
            <Pressable
              style={styles.addButton}
              onPressOut={() => {
                setShowModal(true);
                setError(null);
                setUsername("");
                setPassword("");
              }}
            >
              <Text style={styles.addButtonText}>+ Yangi admin</Text>
            </Pressable>
          </View>
        </>
      )}

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.backText}>Orqaga</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Yangi admin yaratish</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="always"
          >
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Muhim ma'lumot</Text>
              <Text style={styles.infoText}>
                Yangi admin faqat mahsulot va ombor bilan ishlay oladi.
                Adminlar ro'yxatini faqat superAdmin ko'ra oladi.
              </Text>
            </View>

            <Text style={styles.label}>Login</Text>
            <TextInput
              style={styles.input}
              placeholder="Admin loginini kiriting"
              placeholderTextColor={COLORS.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Parol</Text>
            <TextInput
              style={styles.input}
              placeholder="Parolni kiriting (kamida 6 belgi)"
              placeholderTextColor={COLORS.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.createButton, isCreating && styles.createButtonDisabled]}
              onPress={handleCreateAdmin}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.createButtonText}>Yaratish</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  logoutButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.danger,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  adminCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  adminInfo: {
    gap: SPACING.xs,
  },
  adminName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  roleText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
  },
  adminDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  headerSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
  },
  modalBody: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
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
    marginBottom: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  createButton: {
    backgroundColor: COLORS.secondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
});