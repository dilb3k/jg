import { Redirect } from "expo-router";

import { useAuthStore } from "../../src/store/selectors";

/**
 * Entry route ("/"). Resolves to login when unauthenticated (so the app never
 * flashes a protected tab first), otherwise to the role's landing screen.
 */
export default function IndexRedirect() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  const isSuperAdmin = user.role?.toLowerCase() === "superadmin";
  return <Redirect href={isSuperAdmin ? "/(tabs)/users" : "/(tabs)/products"} />;
}
