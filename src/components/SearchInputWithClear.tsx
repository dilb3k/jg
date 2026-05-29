import { StyleSheet, TextInput, TouchableOpacity, View, type TextInputProps } from "react-native";
import { Search, X } from "lucide-react-native";

import { FONT_FAMILY, SPACING, type ThemeColors } from "../theme";

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
        { backgroundColor: colors.surfaceSecondary },
        containerStyle,
      ]}
    >
      <Search size={16} color={colors.textTertiary} style={styles.searchIcon} />
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { color: colors.text }, style]}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.primary}
        underlineColorAndroid="transparent"
      />
      {showClear ? (
        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: colors.surfaceHover }]}
          onPress={() => onChangeText?.("")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Clear"
        >
          <X size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingRight: SPACING.sm,
    minHeight: 48,
    overflow: "hidden",
    borderWidth: 0,
  },
  searchIcon: {
    marginLeft: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: 15,
    fontFamily: FONT_FAMILY.regular,
    letterSpacing: 0,
    borderWidth: 0,
    borderBottomWidth: 0,
    outlineWidth: 0,
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
});
