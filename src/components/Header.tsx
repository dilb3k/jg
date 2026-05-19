import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE } from '../theme';
import { useTheme } from '../store/themeStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Hisvex' }: HeaderProps) {
  const { colors } = useTheme();
  const { isServerReachable } = useNetworkStatus();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: isServerReachable ? colors.secondary : colors.danger }]} />
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>{isServerReachable ? 'Online' : 'Offline'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
  },
});