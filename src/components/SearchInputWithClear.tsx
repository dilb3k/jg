import { StyleSheet, TextInput, TouchableOpacity, View, type TextInputProps } from "react-native";
import { X } from "lucide-react-native";

import { BORDER_RADIUS, SPACING, type ThemeColors } from "../theme";

type Props = TextInputProps & {
  colors: ThemeColors;
  containerStyle?: object;
};

export function SearchInputWithClear({
  colors,
  containerStyle,
  style,
  value,
  onChangeText,
  ...rest
}: Props) {
  const showClear = Boolean(value && String(value).length > 0);

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.surface, borderColor: colors.border },
        containerStyle,
      ]}
    >
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { color: colors.text }, style]}
        placeholderTextColor={colors.textTertiary}
      />
      {showClear ? (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => onChangeText?.("")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Clear"
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingRight: SPACING.xs,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
  },
  clearBtn: {
    padding: SPACING.sm,
    justifyContent: "center",
    alignItems: "center",
  },
});
