import { Redirect } from "expo-router";

/** Legacy route: Add tab merged into Products. */
export default function IndexRedirect() {
  return <Redirect href="/(tabs)/products" />;
}
